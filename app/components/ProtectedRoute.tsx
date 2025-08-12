"use client";

import { useUserContextData } from "../context/userData";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: userLoading } = useUserContextData();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/auth/login");
      } else {
        setHasChecked(true);
      }
    }
  }, [user, userLoading, router]);

  if (userLoading || (!user && !hasChecked)) {
    return null; // still loading or redirecting
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
