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
import { doc, getDoc } from "firebase/firestore";
import { get, ref, set } from "firebase/database";
import { auth, db, database } from "../firebase/firebaseAuth";

// Types
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
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
}

// Context Setup
const UserContext = createContext<UserContextType | undefined>(undefined);
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [businessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  // Dark mode helpers
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

  // Load userData from cache or Firestore
const fetchUserData = async (uid: string): Promise<void> => {
  const userRef = doc(db, "users", uid);

  try {
    setLoading(true);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserData;
      setUserData(data);
      console.log("✅ Fetched fresh userData from Firestore:", data);
    } else {
      console.warn("❗ No user data found in Firestore for UID:", uid);
    }
  } catch (err) {
    console.error("❌ Firestore getDoc error:", err);
  } finally {
    setLoading(false);
  }
};


  // Auth + data listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        await fetchUserData(currentUser.uid);
        const dark = await loadUserPreferences(currentUser.uid);
        setIsDarkMode(dark);
        applyTheme(dark);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);

 const cachedUID = localStorage.getItem("cached_uid");
  if (cachedUID) {
    localStorage.removeItem(`userData_${cachedUID}`);
    localStorage.removeItem(`userDataTimestamp_${cachedUID}`);
    localStorage.removeItem("cached_uid");
  }

        if (pathname.startsWith("/dashboard")) {
          router.push("/auth/login");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        businessData,
        loading,
        setUser,
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
export const useUserContextData = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContextData must be used within a UserProvider");
  }
  return context;
};
