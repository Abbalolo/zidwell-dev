"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import supabase from "@/app/supabase/supabase";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Swal.fire({
        title: "Failed to reset password",
        text: error.message,
        icon: "error",
      });
      setLoading(false);
      return;
    }

    Swal.fire({
      title: "Password Updated!",
      text: "Your password has been successfully updated.",
      icon: "success",
    });

    setLoading(false);
    router.push("/auth/login"); // redirect to login after success
  };

  return (
    <main className="p-5 h-screen">
      <div className="flex flex-col justify-center items-center h-[80%]">
        <h2 className="text-2xl mb-2">Set a New Password</h2>
        <p className="mb-4">Enter your new password below</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[300px]">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">New Password</Label>
            <input
              className="p-2 outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
              type="password"
              id="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errors.password && (
            <p className="text-red-500">{errors.password}</p>
          )}
          <Button
            className="bg-[#C29307] mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default UpdatePassword;
