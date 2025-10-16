"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

  // Clear cookies helper
  const clearCookies = () => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  };

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
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        clearCookies();

        // Replace current history entry with login page
        router.replace("/auth/login");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [lastActivityTime, router, supabase]);

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
