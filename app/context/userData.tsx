"use client";

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { get, ref, set } from "firebase/database";

import { auth, db, database } from "../firebase/firebaseAuth";

// Interfaces
interface Notification {
  id: string;
  message: string;
  createdAt: any;
  isRead?: boolean;
  [key: string]: any;
}

export interface UserData {
  uid: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  profileImageUrl: any;
  signature: string;
  birthDate: string;
  fullAddress: string;
  yesPoint: number;
  blocked: any[];
  idCard: string;
  createdAt: Date;
}

export interface BusinessData {
  uid: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessDescription: string;
  logo: string;
  businessSocial: string;
  businessWeb: string;
  selectedCity: string;
  selectedState: string;
  isYesChecked: boolean;
  isNoChecked: boolean;
  businessCert: string;
  createdAt: Date;
}

interface UserContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  businessData: BusinessData | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<FirebaseUser | null>>;
  isLogin: boolean;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  isSignee: boolean;
  setIsSignee: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
  blogs: any[];
  setBlogs: React.Dispatch<React.SetStateAction<any[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  initiatorNotifications: Notification[];
  setInitiatorNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  signeeNotifications: Notification[];
  setSigneeNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const CACHE_EXPIRY = 5 * 60 * 1000;

// Fetch user data safely
export const fetchUserData = (
  uid: string | undefined,
  setUserData: (data: UserData) => void,
  setLoading: (loading: boolean) => void,
  useRealtime = false
): Unsubscribe => {
  if (!uid) {
    console.warn("Missing UID.");
    setLoading(false);
    return () => {};
  }

  setLoading(true);

  // Try cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`userData_${uid}`);
      const cachedTimestamp = localStorage.getItem(`userDataTimestamp_${uid}`);

      if (cached && cachedTimestamp && Date.now() - parseInt(cachedTimestamp, 10) < CACHE_EXPIRY) {
        setUserData(JSON.parse(cached));
        setLoading(false);
        return () => {};
      }
    } catch {
      localStorage.removeItem(`userData_${uid}`);
      localStorage.removeItem(`userDataTimestamp_${uid}`);
    }
  }

  const userRef = doc(db, "users", uid);

  if (useRealtime) {
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUserData(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(`userData_${uid}`, JSON.stringify(data));
          localStorage.setItem(`userDataTimestamp_${uid}`, Date.now().toString());
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  } else {
    getDoc(userRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserData;
          setUserData(data);
          if (typeof window !== "undefined") {
            localStorage.setItem(`userData_${uid}`, JSON.stringify(data));
            localStorage.setItem(`userDataTimestamp_${uid}`, Date.now().toString());
          }
        }
      })
      .catch((err) => console.error("getDoc error:", err))
      .finally(() => setLoading(false));
    return () => {};
  }
};

// Main provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [businessData] = useState<BusinessData | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initiatorNotifications, setInitiatorNotifications] = useState<Notification[]>([]);
  const [signeeNotifications, setSigneeNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [isSignee, setIsSignee] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const excludedPaths = ["/contact", "/Blog", "/terms-of-use", "/privacy-policy", "/Auth/password-reset", "/Auth/register", "/Auth/login"];
  const isExcluded = excludedPaths.includes(pathname) || pathname.startsWith("/Blog/blogDetails/");

  const applyTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const saveUserPreferences = async (uid: string, darkMode: boolean) => {
    try {
      await set(ref(database, `userPreferences/${uid}`), { darkMode });
    } catch (e) {
      console.error("Saving preferences failed", e);
    }
  };

  const loadUserPreferences = async (uid: string) => {
    try {
      const snap = await get(ref(database, `userPreferences/${uid}`));
      return snap.exists() ? !!snap.val().darkMode : false;
    } catch {
      return false;
    }
  };

  const handleDarkModeToggle = async () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    applyTheme(newVal);
    if (auth.currentUser) await saveUserPreferences(auth.currentUser.uid, newVal);
  };

  useEffect(() => {
    let unsubscribeUserData: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        setUser(currentUser);
        setIsLogin(true);

        unsubscribeUserData = fetchUserData(currentUser.uid, setUserData, setLoading, false);

        const dark = await loadUserPreferences(currentUser.uid);
        setIsDarkMode(dark);
        applyTheme(dark);

        if (typeof window !== "undefined" && ["/", "/auth/login"].includes(window.location.pathname) && currentUser.emailVerified) {
          router.push("/dashboard");
        }
      } else {
        setUser(null);
        setIsLogin(false);
        if (!isExcluded) router.push("/");
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) unsubscribeUserData();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        businessData,
        loading,
        setUser,
        isLogin,
        setIsLogin,
        isSignee,
        setIsSignee,
        isDarkMode,
        setIsDarkMode,
        handleDarkModeToggle,
        blogs,
        setBlogs,
        notifications,
        setNotifications,
        initiatorNotifications,
        setInitiatorNotifications,
        signeeNotifications,
        setSigneeNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook
export const useUserContextData = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContextData must be used within a UserProvider");
  }
  return context;
};
