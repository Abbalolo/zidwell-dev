"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function EmailVerificationPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // If email was passed via state or localStorage
    const savedEmail = localStorage.getItem("pendingEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleResend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Email Sent",
        text: "Check your inbox for a verification link.",
      });
    }
    setLoading(false);
  };

  const checkVerification = async () => {
    setLoading(true);
    const user = supabase.auth.getUser();
    const { data, error } = await user;
    if (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } else if (data.user?.email_confirmed_at) {
      setVerified(true);
      Swal.fire({
        icon: "success",
        title: "Verified!",
        text: "Your email has been verified. Redirecting...",
      }).then(() => router.push("/dashboard"));
    } else {
      Swal.fire({
        icon: "info",
        title: "Not Verified Yet",
        text: "Please check your email and click the verification link.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
        <p className="text-gray-600 mb-6">
          We sent a verification email to <b>{email}</b>. Please check your inbox and click the link to activate your account.
        </p>

        <button
          onClick={checkVerification}
          disabled={loading}
          className="w-full bg-[#C29307] text-white py-3 rounded-lg mb-3 hover:bg-[#a67905] transition"
        >
          {loading ? "Checking..." : "I have verified my email"}
        </button>

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full border border-[#C29307] text-[#C29307] py-3 rounded-lg hover:bg-[#FFF5D9] transition"
        >
          {loading ? "Resending..." : "Resend Email"}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Didn't receive the email? Check your spam folder.
        </p>
      </div>
    </div>
  );
}
