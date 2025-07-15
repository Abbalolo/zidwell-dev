"use client"
import Cookies from "js-cookie"
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin as checkAdminStatus } from "../firebase/firebaseAuth";
export interface User {
  uid: string;
  phone: string;
  email: string;
  name: string;
  status: string;
  statusbg: string;
  statustext: string;
  lastLogin: any;
  createdAt: any;
}
interface AdminContextType {
  isAdmin: boolean | null;
  setIsAdmin: (value: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  analyticsData: any;
  setContracts: React.Dispatch<React.SetStateAction<any>>;
  contracts: any;
  newSignups: any;
  fetchAnalyticsData: (dateRange: string) => Promise<void>;
  handleUsers: any;
  dateRange:any;
  setDateRange: any;
  adminUsers: User[];
  setAdminUsers: React.Dispatch<React.SetStateAction<User[]>>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
      const [adminUsers, setAdminUsers] = useState<User[]>([]);
    const [dateRange, setDateRange] = useState<string>('last7days');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [contracts, setContracts] = useState<any>(null);
 
  const [newSignups, setNewSignups] = useState<any>(null);

  const router = useRouter();

  const fetchDataWithCache = async (cacheKey: string, apiEndpoint: string, setter: Function) => {
    try {
      const cachedData = localStorage.getItem(cacheKey);
      const response = await fetch(apiEndpoint);
      const data = await response.json();

      if (cachedData !== JSON.stringify(data)) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setter(data);
      } else if (cachedData) {
        setter(JSON.parse(cachedData));
      }
    } catch (error) {
      console.error(`Failed to fetch data from ${apiEndpoint}:`, error);
    }
  };

  const fetchAnalyticsData = async (dateRange: string) => {
    await fetchDataWithCache(
      "analyticsData",
      `/api/analyticsData?dateRange=${dateRange}`,
      (data: any) => setAnalyticsData(data?.appUsageLogs)
    );
  };


  const handleUsers = async () => {
    try {
      const cacheKey = "cachedUsers";

      // Get cached data from localStorage
      const cachedData = localStorage.getItem(cacheKey);

      // Fetch data from the API
      const response = await fetch("/api/getUsers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const fetchedData = await response.json();

      if (response.ok) {
        // Compare fetched data with cached data
        const isDataChanged =
          !cachedData || JSON.stringify(fetchedData) !== cachedData;

        if (isDataChanged) {
          console.log("Data has changed, updating cache and state");
          setAdminUsers(fetchedData); // Update the state with new data

          // Update the cache
          localStorage.setItem(cacheKey, JSON.stringify(fetchedData));
        } else {
          console.log("Data is unchanged, using cached data");
          if (cachedData) setAdminUsers(JSON.parse(cachedData)); // Use cached data
        }
      } else {
        console.error(fetchedData.error); // Handle API error
      }
    } catch (error) {
      console.error("Error fetching adminUsers:", error);
    } finally {
      // Stop loading regardless of success or failure
      setLoading(false); // Assuming `isLoading` is managed by a setter
    }
  };



useEffect(() => {
  if (isAdmin === null) {
    setLoading(true); // Start loading state while determining admin status
    initialize();
  } else if (isAdmin) {
    loadAdminData(); // Load admin-specific data for admins
  }
  // Do nothing if not admin (isAdmin === false)
}, [isAdmin]);

const initialize = async () => {
  try {
    const adminStatusRaw = Cookies.get("isAdmin"); // Check cached admin status

    if (adminStatusRaw === "true") {
      setIsAdmin(true); // Set admin status
      await loadAdminData(); // Load admin data
    } else {
      const admin = await checkAdminStatus(); // Verify admin status from backend
      if (admin) {
        setIsAdmin(true);
        Cookies.set("isAdmin", "true"); // Cache admin status
        await loadAdminData();
      } else {
        setIsAdmin(false); // Set non-admin status and do nothing
      }
    }
  } catch (error) {
    console.error("Initialization error:", error); // Log errors for debugging
  } finally {
    setLoading(false); // Stop loading state
  }
};

  
  const loadAdminData = async () => {
    try {
      await Promise.all([
        handleUsers(),
        fetchAnalyticsData(dateRange), // Replace "default" with actual dateRange logic
        fetchDataWithCache("completed-Contracts", "/api/getContracts", setContracts),
        fetchDataWithCache("signups", "/api/getSignups", setNewSignups),
      ]);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };
  
  

  useEffect(() => {
    initialize();
  }, [router]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        setIsAdmin,
        loading,
        setLoading,
        analyticsData,
        setContracts,
        contracts,
        newSignups,
        fetchAnalyticsData,
        handleUsers,
        dateRange, setDateRange, adminUsers,
        setAdminUsers
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within an AdminProvider");
  }
  return context;
};
