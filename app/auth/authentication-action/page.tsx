"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { applyActionCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseAuth";
import checkimg from "./checked.png";
import Image from "next/image";
import Loader from "@/app/components/Loader";


function Page() {
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const queryParams = new URLSearchParams(window.location.search);
      const actionCode = queryParams.get("oobCode");
      const actionMode = queryParams.get("mode");

      setOobCode(actionCode);
      setMode(actionMode);

      const handleAuthAction = async () => {
        try {
          if (actionMode === "verifyEmail" && actionCode) {
            await handleVerifyEmail(actionCode);
          }
        } finally {
          // Only set loading false after verification attempt completes
          if (actionMode !== "verifyEmail") {
            setLoading(false);
          }
        }
      };

      handleAuthAction();
    }
  }, []);

  const handleVerifyEmail = async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      setIsVerified(true);

    } catch (error: any) {
      console.error("Error verifying email:", error.message);
      const errorMessage =
        error.code === "auth/expired-action-code"
          ? "This link has expired. Please request a new verification email."
          : "An error occurred during email verification. Please try again.";
      setErrors({ general: errorMessage });
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (oobCode) {
        await confirmPasswordReset(auth, oobCode, password);
        router.push("/auth/login");
      } else {
        throw new Error("Invalid or missing reset code.");
      }
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setErrors({
        general: "Failed to reset password. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-full bg-white dark:bg-black h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }
  return (
    <main className="p-5 h-screen flex flex-col justify-center items-center fade-in">

      {mode === "verifyEmail" && isVerified && (
        <div className="w-[400px] gap-10 bg-white dark:bg-[#25262A] flex flex-col justify-center items-center py-10 px-5 rounded-lg border z-50">
          <div className="flex flex-col justify-center items-center gap-3">
            <Image
              src={checkimg}
              className={`w-[50px] `}
              alt="check image"
              placeholder="blur"
            />
            <h3 className="text-[20px] text-center my-3">Email Verification Success</h3>
            <p className="text-gray-400 text-center px-5">
              Your email was verified. You can continue using the application.
            </p>
          </div>
          <Button
            className="w-full bg-[#C29307] hover:bg-[#b27c06] transition-colors duration-300"
            onClick={() => router.push("/auth/login")}
            disabled={loading}
          >
            Back to Login
          </Button>
        </div>
      )}

      {mode === "verifyEmail" && !isVerified && (
        <div className="text-center">
          <h2 className="text-2xl mb-2 text-red-500">Verification Failed</h2>
          <p>{errors.general}</p>
          <Button className="mt-4 bg-[#C29307]" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      )}

      {mode === "resetPassword" && (
        <div className="flex flex-col justify-center items-center h-[80%]">
          <h2 className="text-2xl mb-2">Confirm Password</h2>
          <p className="mb-4">Input your new password for confirmation</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[300px]">
            <input
              className="p-2 outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
              type="password"
              id="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="text-red-500">{errors.password}</p>}
            {errors.general && <p className="text-red-500">{errors.general}</p>}
            <Button className="bg-[#C29307] mt-4" type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      )}

      {!mode && (
        <div className="text-center">
          <h2 className="text-2xl mb-2">Invalid Link</h2>
          <p>Please check your email and try again.</p>
          <Button className="mt-4 bg-[#C29307]" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      )}
    </main>
  );
}

export default Page;