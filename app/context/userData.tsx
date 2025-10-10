"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  SetStateAction,
  Dispatch,
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
  walletBalance: number;
  zidcoinBalance: number;
  bvnVerification: string;
  referralCode: string;
}

interface UserContextType {
  user: SupabaseUser | null;
  userData: any | null;
  balance: any | null;
  setUserData: Dispatch<SetStateAction<any | null>>;
  loading: boolean;
  episodes: PodcastEpisode[];
  transactions: any[];
  allTransactions: any[];
  searchTerm: any;
  setSearchTerm: Dispatch<SetStateAction<any>>;
  // login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
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
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setUserData(null);
  };

  // Fetch blog episodes (static)
  const fetchEpisodes = async () => {
    try {
      const res = await fetch("/api/medium-feed");
      const data = await res.json();
      setEpisodes(data);
    } catch (err) {
      console.error("Error fetching episodes:", err);
    }
  };

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

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData?.id) return;

      setLoading(true);

      try {
        const params = new URLSearchParams({
          userId: userData.id,
          limit: "5",
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


  useEffect(() => {
  const fetchAllTransactions = async () => {
    if (!userData?.id) return;

    try {
      const res = await fetch(`/api/bill-transactions?userId=${userData.id}`);
      const data = await res.json();
      setAllTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch all transactions:", error);
      setAllTransactions([]);
    }
  };

  fetchAllTransactions();
}, [userData?.id]);

  // Handle theme
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // // Protect dashboard route
  // useEffect(() => {
  //   if (pathname.startsWith("/dashboard") && !loading && !user) {
  //     router.push("/auth/login");
  //   }
  //   if (["/", "/podcasts"].includes(pathname)) {
  //     fetchEpisodes();
  //   }
  // }, [pathname, user]);

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
        allTransactions,
        searchTerm,
        setSearchTerm,
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
