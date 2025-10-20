"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { useUserContextData } from "../../context/userData";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const reference = params.get("orderReference");
  const userId = params.get("ref");
  const { userData } = useUserContextData();
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "success" | "failed">(
    "pending"
  );

  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (reference && !verified) {
      setVerified(true);
      verifyPayment(reference);
    }
  }, [reference, verified]);

  const verifyPayment = async (ref: string) => {
    try {
      const res = await fetch("/api/fund-account-debit-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "verify",
          userId,
          reference: ref,
          email: userData?.email,
        }),
      });

      const data = await res.json();

      const paymentStatus =
        data.message === "Payment verification completed" ||
        data.data.results[0].status === "SUCCESS";

      if (paymentStatus) {
        setStatus("success");
        Swal.fire({
          icon: "success",
          title: "Payment Successful 🎉",
          text: "Your wallet has been funded successfully!",
          confirmButtonText: "Go to Dashboard",
          confirmButtonColor: "#2563eb", // Tailwind blue-600
        }).then(() => {
          router.push("/dashboard");
        });
      } else {
        setStatus("failed");
        Swal.fire({
          icon: "error",
          title: "Payment Failed ❌",
          text: "We could not verify your payment. Please try again.",
          confirmButtonText: "Retry",
          confirmButtonColor: "#dc2626", 
        }).then(() => {
          router.push("/dashboard");
        });
      }
    } catch (err) {
      setStatus("failed");
      Swal.fire({
        icon: "warning",
        title: "Verification Error ⚠️",
        text: "Something went wrong while verifying your payment.",
        confirmButtonText: "Back to Dashboard",
      }).then(() => {
        router.push("/dashboard");
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      {status === "pending" && (
        <h2 className="text-xl font-semibold animate-pulse">
          🔄 Verifying your payment...
        </h2>
      )}
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
