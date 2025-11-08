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

export interface SupabaseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentLoginSession: string | null;
  zidcoinBalance: number;
  bvnVerification: string;
  role: string;
  referralCode: string;
  state: string | null;
  city: string | null;
  address: string | null;
  dateOfBirth: string;
  profilePicture: string | null;
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
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  fetchNotifications: (filter?: string, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  clearNotificationCache: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

class NotificationCache {
  private cache = new Map();
  private readonly DEFAULT_TTL = 3 * 60 * 1000;
  private readonly UNREAD_COUNT_TTL = 60 * 1000;

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const notificationCache = new NotificationCache();

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const clearNotificationCache = () => {
    notificationCache.clear();
  };

const fetchNotifications = async (filter: string = 'all', limit: number = 50) => {
  if (!userData?.id) {
    console.log('❌ No userData.id available');
    return;
  }

  const cacheKey = `notifications_${userData.id}_${filter}_${limit}`;
  
  const cached = notificationCache.get(cacheKey);
  if (cached && filter === 'all') {
    setNotifications(cached);
    const newUnreadCount = cached.filter((n: Notification) => !n.read_at).length;
    setUnreadCount(newUnreadCount);
    return;
  }

  setNotificationsLoading(true);
  try {
    const params = new URLSearchParams({
      userId: userData.id,
      limit: limit.toString(),
      filter: filter
    });
    const response = await fetch(`/api/notifications?${params.toString()}`);

    
    if (response.ok) {
      const data = await response.json();
  
      
      if (data && Array.isArray(data)) {
        setNotifications(data);
        setLastFetchTime(Date.now());
        
        const newUnreadCount = data.filter((n: Notification) => !n.read_at).length;
        setUnreadCount(newUnreadCount);
 
        
        if (filter === 'all') {
          notificationCache.set(cacheKey, data);
        }
      } else {
        console.error('❌ Invalid data format:', data);
        setNotifications([]);
      }
    } else {
     
      const errorText = await response.text();
     
      const cached = notificationCache.get(cacheKey);
      if (cached) {
        setNotifications(cached);
      } else {
        setNotifications([]);
      }
    }
  } catch (error) {
   
    const cached = notificationCache.get(cacheKey);
    if (cached) {
      setNotifications(cached);
    } else {
      setNotifications([]);
    }
  } finally {
    setNotificationsLoading(false);
  }
};


  const fetchUnreadCount = async () => {
    if (!userData?.id) return;

    const cacheKey = `unread_count_${userData.id}`;
    
    const cached = notificationCache.get(cacheKey);
    if (cached !== undefined) {
      setUnreadCount(cached);
      return;
    }

    try {
      const response = await fetch(`/api/notifications/unread-count?userId=${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        const count = data.unreadCount || 0;
        setUnreadCount(count);
        notificationCache.set(cacheKey, count, 60 * 1000);
      }
    } catch (error) {
      const calculatedCount = notifications.filter(n => !n.read_at).length;
      setUnreadCount(calculatedCount);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!userData?.id) return;

    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

      notificationCache.delete(`notifications_${userData.id}_all_50`);
      notificationCache.delete(`notifications_${userData.id}_unread_50`);
      notificationCache.delete(`unread_count_${userData.id}`);

      const response = await fetch(`/api/notifications/${notificationId}/read?userId=${userData.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ]);
    } catch (error) {
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const markAllAsRead = async () => {
    if (!userData?.id) return;

    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      clearNotificationCache();

      const response = await fetch(`/api/notifications/read-all?userId=${userData.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      await fetchNotifications();
    } catch (error) {
      fetchNotifications(); 
      fetchUnreadCount();
    }
  };

  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${userData.id}`,
        },
        (payload) => {
          clearNotificationCache();
          fetchNotifications();
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${userData.id}`,
        },
        (payload) => {
          clearNotificationCache();
          fetchNotifications();
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  useEffect(() => {
    if (userData?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userData?.id]);

  useEffect(() => {
    if (!userData?.id) return;

    const cleanupInterval = setInterval(() => {
      notificationCache.cleanup();
    }, 5 * 60 * 1000);

    const refreshInterval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [userData?.id]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("userData");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse localStorage user:", error);
    }
  }, []);

  const fetchEpisodes = async () => {
    const cacheKey = 'podcast_episodes';
    const cached = notificationCache.get(cacheKey);
    
    if (cached) {
      setEpisodes(cached);
      return;
    }

    try {
      const res = await fetch("/api/medium-feed");
      const data = await res.json();
      setEpisodes(data);
      notificationCache.set(cacheKey, data, 10 * 60 * 1000);
    } catch (err) {
      const cached = notificationCache.get(cacheKey);
      if (cached) {
        setEpisodes(cached);
      }
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!userData?.id) return;

      const cacheKey = `balance_${userData.id}`;
      const cached = notificationCache.get(cacheKey);
      
      if (cached !== undefined && cached !== null) {
        setBalance(cached);
        return;
      }

      try {
        const res = await fetch("/api/wallet-balance", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: userData.id }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch balance');
        }

        const balance = data.wallet_balance ?? 0;
        setBalance(balance);
        notificationCache.set(cacheKey, balance, 2 * 60 * 1000);
        
      } catch (error) {
        if (cached !== undefined && cached !== null) {
          setBalance(cached);
        } else if (userData?.zidcoinBalance !== undefined) {
          setBalance(userData.zidcoinBalance);
        } else {
          setBalance(0);
        }
      }
    };

    if (userData?.id) {
      fetchBalance();
    }
  }, [userData?.id, userData?.zidcoinBalance]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData?.id) return;

      const cacheKey = `transactions_${userData.id}_${searchTerm}`;
      const cached = notificationCache.get(cacheKey);
      
      if (cached) {
        setTransactions(cached);
        return;
      }

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
        const transactions = data.transactions || [];
        setTransactions(transactions);
        notificationCache.set(cacheKey, transactions, 3 * 60 * 1000);
      } catch (error) {
        setTransactions([]);
        if (cached) {
          setTransactions(cached);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [userData?.id, searchTerm]);

  useEffect(() => {
    const fetchTransactionStats = async () => {
      if (!userData?.id) return;

      const cacheKey = `transaction_stats_${userData.id}`;
      const cached = notificationCache.get(cacheKey);
      
      if (cached) {
        setLifetimeBalance(cached.lifetimeBalance);
        setTotalOutflow(cached.totalOutflow);
        setTotalTransactions(cached.totalTransactions);
        return;
      }

      try {
        const res = await fetch("/api/total-inflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });

        const data = await res.json();
        const stats = {
          lifetimeBalance: data.totalInflow || 0,
          totalOutflow: data.totalOutflow || 0,
          totalTransactions: data.totalTransactions || 0
        };
        
        setLifetimeBalance(stats.lifetimeBalance);
        setTotalOutflow(stats.totalOutflow);
        setTotalTransactions(stats.totalTransactions);
        notificationCache.set(cacheKey, stats, 5 * 60 * 1000);
      } catch (error) {
        if (cached) {
          setLifetimeBalance(cached.lifetimeBalance);
          setTotalOutflow(cached.totalOutflow);
          setTotalTransactions(cached.totalTransactions);
        }
      }
    };
    fetchTransactionStats();
  }, [userData?.id]);

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

  // useEffect(() => {
  //   fetchEpisodes();
  // }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        balance,
        setUserData,
        loading,
        episodes,
        isDarkMode,
        setIsDarkMode,
        handleDarkModeToggle,
        transactions,
        lifetimeBalance,
        totalOutflow,
        totalTransactions,
        searchTerm,
        setSearchTerm,
        notifications,
        unreadCount,
        notificationsLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        fetchUnreadCount,
        clearNotificationCache,
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