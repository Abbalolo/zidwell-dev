"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

  // Track user activity - reset timer on any user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    // Track various user activities
    const events = [
      "mousemove", 
      "mousedown", 
      "click", 
      "scroll",
      "keydown", 
      "keypress",
      "keyup",
      "touchstart",
      "touchmove",
      "touchend",
      "focus",
      "blur",
      "input",
      "change"
    ];

    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Auto logout only after 15 minutes of complete inactivity
  useEffect(() => {
    let logoutTimer: NodeJS.Timeout;
    let alreadyLoggedOut = false;

    const checkInactivity = async () => {
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityTime;
      
      // Check if user has been inactive for 15 minutes
      if (!alreadyLoggedOut && timeSinceLastActivity > INACTIVITY_LIMIT) {
        alreadyLoggedOut = true;
        
        console.log("User inactive for 15 minutes, logging out...");

        try {
          // Sign out via API
          await fetch("/api/logout", { method: "POST" });
        } catch (error) {
          console.error("Logout API error:", error);
        }

        // Clear local storage
        if (typeof window !== "undefined") {
          localStorage.removeItem("userData");
          localStorage.clear();
        }

        // Redirect to login
        router.replace("/auth/login");
      }
    };

    // Check every 30 seconds (less frequent to reduce performance impact)
    logoutTimer = setInterval(checkInactivity, 30000);

    return () => {
      if (logoutTimer) clearInterval(logoutTimer);
    };
  }, [lastActivityTime, router]);

  // Optional: Handle page visibility (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the tab, update activity time
        setLastActivityTime(Date.now());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}