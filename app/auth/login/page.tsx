"use client";
import Swal from "sweetalert2";
import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "/public/zidwell-logo.png";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/app/firebase/firebaseAuth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseAuth";
import Cookies from "js-cookie";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

// Dummy admin check function
const checkAdminStatus = async (): Promise<boolean> => {
  return true;
};

const page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [showVerifyButton, setShowVerifyButton] = useState(false);

  const redirectTo = "/dashboard";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Please enter a password";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;


      if (!user.emailVerified) {
        await sendEmailVerification(user);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer:
            "You need to verify your email to log in. A verification email has been sent.",
        });
        setErrors({
          email:
            "You need to verify your email to log in. A verification email has been sent.",
        });
        setShowVerifyButton(true);
        await signOut(auth);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      // const admin = await checkAdminStatus();

      // if (admin) {
      //   Cookies.set("isAdmin", "true");
      // }

      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });

      setIsLogin(true);
      setErrors({});
      Swal.fire({
        title: "Success!",
        icon: "success",
      
      });
      router.push(redirectTo);
      // Cookies.set("authToken", idToken, { path: "/", expires: 1 });
    } catch (error: any) {
      console.error(error.message);

      // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
      if (error.code === "auth/invalid-login-credentials") {
        setErrors({ password: "Invalid email or password" });
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Invalid email or password",
          
        });
      } else {
        setErrors({ password: "An unexpected error occurred" });
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: "Please try again later.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        router.push(redirectTo);
        Swal.fire({
          title: "Success!",
          icon: "success",
          draggable: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: "Email is not verified yet. Please check your inbox.",
        });
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: "Please log in again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 fade-in">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src={logo}
              alt="Zidwell Logo"
              width={32}
              height={32}
              className="mr-2"
            />
            <h1 className="font-bold text-lg">Zidwell</h1>
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

          {showVerifyButton && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 mb-2">
                After verifying your email, click below to continue.
              </p>
              <Button
                onClick={handleCheckVerification}
                className="bg-green-600 text-white"
              >
                I've Verified My Email
              </Button>
            </div>
          )}

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
  );
};

export default page;
