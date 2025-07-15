"use client";
import Swal from "sweetalert2";
import React, { FormEvent, useState } from "react";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseAuth";

function PasswordReset() {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors if validation passes
    setErrors({});
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: "http://localhost:3000/auth/login",
      });

      Swal.fire({
        title: `Password reset email sent to:, ${email}`,
        icon: "success",
      });
      console.log("Password reset email sent to:", email);
      // router.push("/auth/password-reset/succeed");
    } catch (error) {
      Swal.fire({
        title: `Failed to send password reset email. Please try again later.`,
        icon: "error",
      });
      console.error("Error sending password reset email:", error);
      setErrors({
        general: "Failed to send password reset email. Please try again later.",
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
            className="bg-[#C29307]  mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default PasswordReset;
