"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

  // 🔹 Function to clear all cookies
  const clearCookies = () => {
    const cookies = document.cookie.split(";"); // Get all cookies
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  };

  // 🔹 Track user activity
  useEffect(() => {
    const updateActivity = () => setLastActivityTime(Date.now());
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, []);

  // 🔹 Auto logout after inactivity
  useEffect(() => {
    const interval = setInterval(async () => {
      if (Date.now() - lastActivityTime > INACTIVITY_LIMIT) {
        await supabase.auth.signOut(); // Logout Supabase
        localStorage.clear(); // Clear localStorage
        sessionStorage.clear(); // Clear sessionStorage
        clearCookies(); // Clear cookies
        router.push("/auth/login"); // Redirect
      }
    }, 60000); // Every 1 minute check

    return () => clearInterval(interval);
  }, [lastActivityTime]);

  return <>{children}</>;
}
