"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    // get the saved login timestamp
    const loginAt = localStorage.getItem("loginAt");

    if (!loginAt) {
      // first login, set it
      localStorage.setItem("loginAt", Date.now().toString());
      return;
    }

    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; // 3 days in ms
    const loginTime = parseInt(loginAt, 10);

    const checkSession = () => {
      const now = Date.now();
      if (now - loginTime >= THREE_DAYS) {
        // clear storage & redirect
        localStorage.removeItem("loginAt");
        localStorage.removeItem("userData");

        Swal.fire({
          icon: "info",
          title: "Session Expired",
          text: "For your security, please log in again.",
          confirmButtonColor: "#C29307",
        }).then(() => {
          router.push("/auth/login"); 
        });
      }
    };

    // check immediately on load
    checkSession();

    // check every minute
    const interval = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
