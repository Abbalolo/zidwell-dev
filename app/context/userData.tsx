"use client";

import { createContext, useState, useEffect, useContext, ReactNode, SetStateAction, Dispatch } from "react";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";
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

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  walletBalance: number;
}

interface UserContextType {
  user: SupabaseUser | null;
  userData: UserData | null;
  setUserData: Dispatch<SetStateAction<UserData | null>>;
  loading: boolean;
  episodes: PodcastEpisode[];
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
}
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Login
  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        Swal.fire({ icon: "error", title: "Login failed", text: error?.message || "Invalid credentials" });
        return;
      }

      const authUser: SupabaseUser = {
        id: data.user.id,
        email: data.user.email!,
      };

      setUser(authUser);
      await fetchUserData(authUser.id);

      Swal.fire({ icon: "success", title: "Login successful", timer: 1500, showConfirmButton: false });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      Swal.fire({ icon: "error", title: "Unexpected Error", text: err.message || "Try again later." });
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    localStorage.removeItem("userData");
    router.push("/auth/login");
  };

  // Fetch profile info from DB
  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, phone, wallet_balance")
        .eq("id", userId)
        .single();

      if (error || !data) throw new Error("User data not found");

      const profile: UserData = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        walletBalance: data.wallet_balance,
      };

      setUserData(profile);
      localStorage.setItem("userData", JSON.stringify(profile));
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUserData(null);
    }
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
  let sub: ReturnType<typeof supabase.channel> | null = null;

  const init = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return;

    // Load from localStorage first (fast)
    const stored = localStorage.getItem("userData");
    if (stored) {
      setUserData(JSON.parse(stored));
    }

    // 🔄 Always fetch latest once from DB to avoid stale values
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone, wallet_balance")
      .eq("id", authUser.id)
      .single();

    if (data) {
      const profile = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        walletBalance: data.wallet_balance,
      };
      setUserData(profile);
      localStorage.setItem("userData", JSON.stringify(profile));
    }

    // ✅ Realtime subscription
    sub = supabase
      .channel("wallet-listener")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${authUser.id}`,
        },
        (payload) => {
          const newBalance = payload.new.wallet_balance;

          setUserData((prev) => {
            if (!prev) return prev;
            if (prev.walletBalance !== newBalance) {
              const updated = { ...prev, walletBalance: newBalance };
              localStorage.setItem("userData", JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      )
      .subscribe();
  };

  init();

  return () => {
    if (sub) supabase.removeChannel(sub);
  };
}, []);






  // Handle theme
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Protect dashboard route
  useEffect(() => {
    if (pathname.startsWith("/dashboard") && !loading && !user) {
      router.push("/auth/login");
    }
    if (["/", "/podcasts"].includes(pathname)) {
      fetchEpisodes();
    }
  }, [pathname, user, loading]);

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
        setUserData,
        loading,
        episodes,
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

export const useUserContextData = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContextData must be used inside UserProvider");
  return context;
};
