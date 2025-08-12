// context/UserContext.tsx
"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";

import supabase from "../supabase/supabase";

export type PodcastEpisode = {
  id: string;
  title: string;
  creator: string;
  pubDate: string;
  link: string;
  tags?: string[];
};

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  walletBalance: number;
  walletId: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankCode: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  episodes: PodcastEpisode[];
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
}

// Context Setup
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const res = await fetch("/api/medium-feed");
        const data = await res.json();
        // console.log(data)
        setEpisodes(data);
      } catch (err) {
        console.error("Error fetching podcast:", err);
      } finally {
        setLoading(false);
      }
    };

    if (["/", "/podcasts"].includes(pathname)) {
      fetchEpisodes();
    }
  }, []);
  const router = useRouter();
  const pathname = usePathname();

  // Dark mode
  const applyTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const handleDarkModeToggle = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    applyTheme(newVal);
  };

 
  // LOGIN (sets secure cookie via API)


const login = async (credentials: { email: string; password: string }) => {
  try {
    setLoading(true);

    const response = await fetch("/api/paybeta-auth-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");

    const { user, supabaseToken } = data;

 
    localStorage.setItem("supabaseToken", supabaseToken);

   
    setUser(user);

    // console.log("✅ User logged in:", user);
  } catch (error: any) {
    console.error("Login error:", error.message);
    throw error;
  } finally {
    setLoading(false);
  }
};



  // LOGOUT (clears secure cookie via API)
  const logout = async () => {
    try {
      await fetch("/api/paybeta-auth-logout", { method: "POST" });
      setUser(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // FETCH USER from secure cookie
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/paybeta-user");
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // console.log("User fetched:", data.user);
      } else {
        setUser(null);
        
      }

      // Set dark mode
      // const storedTheme = localStorage.getItem("theme");
      // const dark = storedTheme === "dark";
      // setIsDarkMode(dark);
      // applyTheme(dark);
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

 


  // On mount, check user via secure cookie
 useEffect(() => {
  if (pathname.includes("/dashboard")) {
    fetchUser();
  }
}, [pathname]);


  return (
    <UserContext.Provider
      value={{
        user,
        episodes,
        loading,
        login,
        logout,
        isDarkMode,
        setIsDarkMode,
        handleDarkModeToggle,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook
export const useUserContextData = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserContextData must be used inside UserProvider");
  return context;
};
