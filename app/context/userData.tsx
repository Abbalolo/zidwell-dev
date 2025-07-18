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
import {
  doc,
  getDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { get, ref, set } from "firebase/database";
import { auth, db, database } from "../firebase/firebaseAuth";


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

const UserContext = createContext<UserContextType | undefined>(undefined);
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const fetchUserData = (
  uid: string | undefined,
  setUserData: (data: UserData) => void,
  setLoading: (loading: boolean) => void,
  useRealtime = false
): Unsubscribe => {
  if (!uid) {
    console.warn("❌ Missing UID");
    setLoading(false);
    return () => {};
  }

  const userRef = doc(db, "users", uid);
  const cacheKey = `userData_${uid}`;
  const cacheTimestampKey = `userDataTimestamp_${uid}`;

  try {
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

    const isValid =
      cachedData &&
      cachedTimestamp &&
      Date.now() - parseInt(cachedTimestamp) < CACHE_EXPIRY;

    if (isValid) {
      const parsed = JSON.parse(cachedData);
      console.log("📦 Loaded userData from localStorage:", parsed);
      setUserData(parsed);
      setLoading(false);
      return () => {};
    }
  } catch (err) {
    console.warn("⚠️ Error reading from localStorage", err);
  }

  const saveToCache = (data: UserData) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
      localStorage.setItem("cached_uid", uid); // ✅ Save uid
    } catch (err) {
      console.warn("⚠️ Error saving userData to localStorage", err);
    }
  };

  if (useRealtime) {
    setLoading(true);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserData;
        console.log("🔥 Realtime userData:", data);
        setUserData(data);
        saveToCache(data);
      }
      setLoading(false);
    });
    return unsubscribe;
  }

  setLoading(true);
  getDoc(userRef)
    .then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserData;
        console.log("🔥 Loaded userData from Firestore:", data);
        setUserData(data);
        saveToCache(data);
      } else {
        console.warn("❗ No user data found for UID:", uid);
      }
    })
    .catch((err) => {
      console.error("❌ Firestore getDoc error:", err);
    })
    .finally(() => {
      setLoading(false);
    });

  return () => {};
};


// export const getUserDataById = async (uid: string) => {
//   try {
//     const userDocRef = doc(db, "users", uid);
//     const docSnap = await getDoc(userDocRef);

//     if (docSnap.exists()) {
//       return docSnap.data();
//     } else {
//       console.warn("No user document found for UID:", uid);
//       return null;
//     }
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     throw error;
//   }
// };


export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [businessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [isSignee, setIsSignee] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
 
  const pathname = usePathname();
  const router = useRouter();


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
    if (currentUser) {
      setUser(currentUser);
      setIsLogin(true);

      // ✅ Immediately set loading to true while fetching userData
      setLoading(true);

      unsubscribeUserData = fetchUserData(
        currentUser.uid,
        (data) => {
          setUserData(data);
          setLoading(false); // ✅ Stop loading after data is set
        },
        () => {} // skip internal loading logic from fetchUserData
      );

      const dark = await loadUserPreferences(currentUser.uid);
      setIsDarkMode(dark);
      applyTheme(dark);
    } else {
      setUser(null);
      setUserData(null);
      setIsLogin(false);
      setLoading(false);

      if (pathname.startsWith("/dashboard")) {
        router.push("/auth/login");
      }
    }
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeUserData) unsubscribeUserData();
  };
}, []);


// useEffect(() => {
//   const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
//     setLoading(true);
//     if (currentUser) {
//       setUser(currentUser);

//       try {
//         const data = await getUserDataById(currentUser.uid);
//         if (data) {
//           setUserData(data as UserData);
//           console.log("📦 Loaded userData:", data);
//         } else {
//           console.warn("⚠️ No user data found");
//         }

//         const dark = await loadUserPreferences(currentUser.uid);
//         setIsDarkMode(dark);
//         applyTheme(dark);
//       } catch (error) {
//         console.error("❌ Failed to load user data or preferences", error);
//       } finally {
//         setLoading(false);
//       }

//     } else {
//       setUser(null);
//       setUserData(null);
//       setIsLogin(false);
//       setLoading(false);

//       if (pathname.startsWith("/dashboard")) {
//         router.push("/auth/login");
//       }
//     }
//   });

//   return () => {
//     unsubscribeAuth();
//   };
// }, []);

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

export const useUserContextData = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContextData must be used within a UserProvider");
  }
  return context;
};
