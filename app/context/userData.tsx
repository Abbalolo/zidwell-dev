"use client";

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, database, db } from "../firebase/firebaseAuth";
import { usePathname, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { get, ref, set } from "firebase/database";

// Types
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
  notifications: Notification[];
  initiatorNotifications: Notification[];
  signeeNotifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setInitiatorNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setSigneeNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  blogs: any[];
  setBlogs: React.Dispatch<React.SetStateAction<any[]>>;
  user: FirebaseUser | null;
  userData: UserData | null;
  businessData: BusinessData | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<FirebaseUser | null>>;
  isLogin: boolean;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  isSignee: boolean;
  setIsSignee: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  handleDarkModeToggle: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache timeout
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const fetchUserData = (
  uid: string,
  setUserData: (data: UserData) => void,
  setLoading: (loading: boolean) => void,
  useRealtime: boolean = false
): Unsubscribe => {
  setLoading(true);
  try {
    const cachedData = localStorage.getItem(`userData_${uid}`);
    const cachedTimestamp = localStorage.getItem(`userDataTimestamp_${uid}`);

    if (cachedData && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp);
      if (age < CACHE_EXPIRY) {
        setUserData(JSON.parse(cachedData));
        setLoading(false);
        return () => {};
      }
    }

    const userDocRef = doc(db, "users", uid);

    if (useRealtime) {
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as UserData;
            setUserData(data);
            console.log("User data fetched from Firestore:", data);
            localStorage.setItem(`userData_${uid}`, JSON.stringify(data));
            localStorage.setItem(`userDataTimestamp_${uid}`, Date.now().toString());
          }
          setLoading(false);
        },
        (error) => {
          console.error("Snapshot error:", error);
          setLoading(false);
        }
      );
      return unsubscribe;
    } else {
      getDoc(userDocRef)
        .then((docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as UserData;
            setUserData(data);
            localStorage.setItem(`userData_${uid}`, JSON.stringify(data));
            localStorage.setItem(`userDataTimestamp_${uid}`, Date.now().toString());
          } else {
            console.warn("No user data found");
          }
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        })
        .finally(() => {
          setLoading(false);
        });
      return () => {};
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    setLoading(false);
    return () => {};
  }
};

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [businessData] = useState<BusinessData | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initiatorNotifications, setInitiatorNotifications] = useState<Notification[]>([]);
  const [signeeNotifications, setSigneeNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [isSignee, setIsSignee] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const pathname = usePathname();
  const router = useRouter();

  const excludePaths = [
    "/contact",
    "/Blog",
    "/terms-of-use",
    "/privacy-policy",
    "/Auth/password-reset",
    "/Auth/authentication-action",
    "/Auth/password-reset/succeed",
    "/Auth/register",
    "/Auth/login",
  ];
  const isExcluded =
    excludePaths.includes(pathname) || pathname.startsWith("/Blog/blogDetails/");

  const applyTheme = (darkMode: boolean) => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  };

  const saveUserPreferences = async (userId: string, darkMode: boolean) => {
    try {
      const userPreferencesRef = ref(database, `userPreferences/${userId}`);
      await set(userPreferencesRef, { darkMode });
    } catch (error) {
      console.error("Error saving user preferences: ", error);
    }
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const userPreferencesRef = ref(database, `userPreferences/${userId}`);
      const snapshot = await get(userPreferencesRef);
      return snapshot.exists() ? snapshot.val().darkMode || false : false;
    } catch (error) {
      console.error("Error loading user preferences: ", error);
      return false;
    }
  };

  const handleDarkModeToggle = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
    const currentUser = auth.currentUser;
    if (currentUser) {
      await saveUserPreferences(currentUser.uid, newDarkMode);
    }
  };

 useEffect(() => {
  let unsubscribeUserData: Unsubscribe | null = null;

  const handleAuthChange = async (currentUser: FirebaseUser | null) => {
    setLoading(true);

    if (currentUser) {
      setUser(currentUser);
      setIsLogin(true);

      unsubscribeUserData = fetchUserData(currentUser.uid, setUserData, setLoading, false);

      const darkModePreference = await loadUserPreferences(currentUser.uid);
      setIsDarkMode(darkModePreference);
      applyTheme(darkModePreference);

      // ✅ Only redirect to dashboard if on the root or login page
      if (
        typeof window !== "undefined" &&
        (window.location.pathname === "/" || window.location.pathname === "/auth/login") &&
        currentUser.emailVerified
      ) {
        router.push("/dashboard");
      }
    } else {
      setUser(null);
      setIsLogin(false);
      if (!isExcluded) router.push("/");
    }

    setLoading(false);
  };

  const unsubscribeAuth = onAuthStateChanged(auth, handleAuthChange);

  return () => {
    unsubscribeAuth();
    if (unsubscribeUserData) unsubscribeUserData();
  };
}, []); // ✅ Remove pathname and router from dependencies

  return (
    <UserContext.Provider
      value={{
        user,
        blogs,
        setBlogs,
        userData,
        businessData,
        loading,
        setUser,
        isLogin,
        setIsLogin,
        isDarkMode,
        setIsDarkMode,
        handleDarkModeToggle,
        isSignee,
        setIsSignee,
        notifications,
        initiatorNotifications,
        signeeNotifications,
        setInitiatorNotifications,
        setSigneeNotifications,
        setNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

const useUserContextData = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContextData must be used within a UserProvider");
  }
  return context;
};

export { UserProvider, useUserContextData };
