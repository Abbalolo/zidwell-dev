"use client";

import Swal from "sweetalert2";
import React, { FormEvent, useState } from "react";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import supabase from "@/app/supabase/supabase";


const PasswordReset = () => {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();


  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/password-reset/update-password`, 
        
      });

      console.log(error)

      if (error) throw error;

      Swal.fire({
        title: `Password reset link sent to: ${email}`,
        icon: "success",
      });
    } catch (error: any) {
      Swal.fire({
        title: `Failed to send password reset email. Please try again later.`,
        icon: "error",
      });
      setErrors({
        general: error.message || "Failed to send password reset email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-5 h-screen">
      <div className="flex flex-col justify-center items-center h-[80%]">
        <h2 className="text-2xl mb-2">Forgotten Password</h2>
        <p className="mb-4">Input your email for verification</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[300px]">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <input
              className="p-2 outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {errors.email && <p className="text-red-500">{errors.email}</p>}
          {errors.general && <p className="text-red-500">{errors.general}</p>}
          <Button
            className="bg-[#C29307] mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default PasswordReset;
