// context/userData.tsx
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import supabase from "../supabase/supabase";

export type PodcastEpisode = {
  id: string;
  title: string;
  creator: string;
  pubDate: string;
  link: string;
  tags?: string[];
};

interface SupabaseUser {
  id: string;
  email: string;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  current_login_session: any;
  zidcoinBalance: number;
  bvnVerification: string;
  referralCode: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  channels: string[];
  read_at: string | null;
  created_at: string;
}

interface UserContextType {
  user: SupabaseUser | null;
  userData: any | null;
  balance: number | null;
  setUserData: Dispatch<SetStateAction<any | null>>;
  loading: boolean;
  episodes: PodcastEpisode[];
  transactions: any[];
  lifetimeBalance: number;
  totalOutflow: number;
  totalTransactions: number;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  logout: () => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
  
  // Notification-related state
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [lifetimeBalance, setLifetimeBalance] = useState(0);
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    setNotifications([]);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userData?.id) return;
    
    // Only fetch if it's been more than 30 seconds since last fetch
    const now = Date.now();
    if (now - lastFetchTime < 30000 && notifications.length > 0) {
      return;
    }

    setNotificationsLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userData, 
          limit: 20 // Fetch more for the context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setLastFetchTime(now);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!userData?.id) return;

    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );

      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData })
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Revert optimistic update on error
      fetchNotifications(); // Refetch to get correct state
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!userData?.id) return;

    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );

      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData })
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      fetchNotifications(); // Refetch to get correct state
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Auto-fetch notifications when user data changes
  useEffect(() => {
    if (userData?.id) {
      fetchNotifications();
    }
  }, [userData?.id]);

  // Optional: Periodic refresh (every 2 minutes) when user is active
  useEffect(() => {
    if (!userData?.id) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [userData?.id]);

  // Your existing effects remain the same...
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("userData");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Failed to parse localStorage user:", error);
    }
  }, []);

  // Fetch podcast episodes
  const fetchEpisodes = async () => {
    try {
      const res = await fetch("/api/medium-feed");
      const data = await res.json();
      setEpisodes(data);
    } catch (err) {
      console.error("Error fetching episodes:", err);
    }
  };

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/wallet-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        const data = await res.json();
        setBalance(data.wallet_balance ?? 0);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    fetchBalance();
  }, [userData?.id]);

  // Fetch all transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData?.id) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          userId: userData.id,
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const res = await fetch(`/api/bill-transactions?${params.toString()}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [userData?.id, searchTerm]);

  // Fetch lifetime stats
  useEffect(() => {
    const fetchTransactionStats = async () => {
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/total-inflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });

        const data = await res.json();
        setLifetimeBalance(data.totalInflow || 0);
        setTotalOutflow(data.totalOutflow || 0);
        setTotalTransactions(data.totalTransactions || 0);
      } catch (error) {
        console.error("Failed to fetch transaction stats:", error);
      }
    };
    fetchTransactionStats();
  }, [userData?.id]);

  // Dark mode
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleDarkModeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        balance,
        setUserData,
        loading,
        episodes,
        logout,
        isDarkMode,
        setIsDarkMode,
        handleDarkModeToggle,
        transactions,
        lifetimeBalance,
        totalOutflow,
        totalTransactions,
        searchTerm,
        setSearchTerm,
        
        // Notification context
        notifications,
        unreadCount,
        notificationsLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContextData = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserContextData must be used inside UserProvider");
  return context;
};