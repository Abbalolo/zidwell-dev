"use client";
import Swal from "sweetalert2";
import { useState, FormEvent, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Cookies from "js-cookie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { UserData, useUserContextData } from "@/app/context/userData";

import Carousel from "@/app/components/Carousel";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/app/supabase/supabase";
import { sendLoginNotificationWithDeviceInfo } from "@/lib/login-notification";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const { setUserData } = useUserContextData();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const fromLogin = searchParams.get("fromLogin");
  const scrollToPricing = searchParams.get("scrollToPricing");

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

      if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Invalid email or password");

      const profile = result.profile;
      const isVerified = result.isVerified;

      if (!profile) throw new Error("User profile not found.");

      if (profile) {
        await fetch("/api/activity/last-login", {
          method: "POST",
          body: JSON.stringify({
            user_id: profile.id,
            email: profile.email,
          }),
        });
      }

      // 2️⃣ Save profile locally
      setUserData(profile);

      localStorage.setItem("userData", JSON.stringify(profile));

      // 3️⃣ Save verification state in a cookie (optional)
      Cookies.set("verified", isVerified ? "true" : "false", {
        expires: 7,
        path: "/",
      });

      await sendLoginNotificationWithDeviceInfo(profile);

      // 4️⃣ Show success and redirect
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        if (fromLogin === "true") {
          // User came from pricing component, redirect back with parameters
          if (scrollToPricing === "true") {
            // Redirect back to the original page with scroll parameters
            router.push(`${returnUrl}?fromLogin=true&scrollToPricing=true`);
          } else {
            router.push(returnUrl);
          }
        } else {
          // Normal login flow - go to onboarding or dashboard based on verification
          router.push(isVerified ? "/dashboard" : "/onboarding");
        }
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.message || "Invalid email or password",
      });
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  return (
    <div className="lg:flex lg:justify-between bg-gray-50 min-h-screen fade-in">
      <div
        className="lg:w-[50%] min-h-screen md:h-full flex justify-center md:items-start items-center px-6 md:py-8 fade-in bg-cover bg-center"
        style={
          isMobile
            ? {
                backgroundImage: `url("/zidwell-bg-mobile.jpg")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      >
        <Card className="w-full max-w-md h-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Image
                src={logo}
                alt="Zidwell Logo"
                width={32}
                height={32}
                className="w-20 object-contain"
              />
              {/* <h1 className="font-bold text-lg">Zidwell</h1> */}
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Zidwell account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/auth/password-reset"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="bg-[#C29307] w-full"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Carousel />
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
