"use client";
import { useEffect, useState } from "react";

export default function ExpiryTimer({ expiryDate }: { expiryDate?: string }) {
  const [timeLeft, setTimeLeft] = useState("...");

  console.log(expiryDate)

  useEffect(() => {
    if (!expiryDate) {
      setTimeLeft("No expiry");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(expiryDate).getTime();

      if (isNaN(end)) {
        setTimeLeft("Invalid date");
        clearInterval(interval);
        return;
      }

      const distance = end - now;
      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  return <span className="font-semibold text-red-600">{timeLeft}</span>;
}
