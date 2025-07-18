"use client";

import { useUserContextData } from "../context/userData";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useUserContextData();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Once loading finishes
    if (!loading) {
      if (!user) {
        // 👇 Redirect to login if unauthenticated
        router.replace("/auth/login");
      } else {
        setHasChecked(true); // ✅ Ready to render protected content
      }
    }
  }, [user, loading, router]);

  // 👇 Still checking auth
  if (loading || (!user && !hasChecked)) {
    return null; // prevent flicker or render
  }

  return <>{children}</>;
};

export default ProtectedRoute;
