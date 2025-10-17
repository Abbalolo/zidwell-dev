"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function SessionWatcher({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

  // Track user activity
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


  // Auto logout after inactivity
  useEffect(() => {
    let alreadyLoggedOut = false;

    const interval = setInterval(async () => {
      if (!alreadyLoggedOut && Date.now() - lastActivityTime > INACTIVITY_LIMIT) {
        alreadyLoggedOut = true;

        // Sign out via Supabase (removes HttpOnly cookies)
        await fetch("/api/logout", { method: "POST" });
  
        if (typeof window !== "undefined") {
          localStorage.removeItem("userData");
          localStorage.clear();
        }
  
        // Redirect to login
        router.replace("/auth/login");
      }
    }, 10000); // check every 10 seconds for more responsiveness

    return () => clearInterval(interval);
  }, [lastActivityTime, router]);

  // Prevent browser back button from showing cached page
  useEffect(() => {
    const handlePopState = () => {
      router.replace("/auth/login");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return <>{children}</>;


  
}
