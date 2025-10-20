"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Swal from "sweetalert2";

function SubscribePage() {
  const search = useSearchParams();
  const router = useRouter();

  // Prefill plan and amount from query string
  const prefillPlan = search.get("plan") || "";
  const prefillAmount = search.get("amount") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [planId] = useState(prefillPlan);
  const [amount] = useState(prefillAmount);
  const [loading, setLoading] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();

    if (!fullName.trim() || !email.trim() || !planId.trim() || !amount) {
      Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Please complete name, email, plan and amount.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid email",
        text: "Please enter a valid email address.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    const numericAmount = Number(String(amount).replace(/[^0-9.-]+/g, ""));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid amount",
        text: "Please enter a valid amount.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          planId,
          amount: 100,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Subscription failed",
          text: data.error || "Failed to start checkout",
          confirmButtonColor: "#C29307",
        });
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Redirecting to payment",
        text: "You will be redirected to a secure card checkout.",
        timer: 1800,
        showConfirmButton: false,
      });

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        Swal.fire({
          icon: "error",
          title: "Checkout link missing",
          text: "We couldn't get a checkout URL. Try again later.",
          confirmButtonColor: "#C29307",
        });
      }
    } catch (err: any) {
      console.error("subscribe submit error:", err);
      Swal.fire({
        icon: "error",
        title: "Network error",
        text: "Unable to connect. Try again later.",
        confirmButtonColor: "#C29307",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Subscribe</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              placeholder="you@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Plan</label>
            <input
              disabled
              value={planId}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (NGN)</label>
            <input
              disabled
              value={amount}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !fullName.trim() || !email.trim() || !planId.trim() || !amount}
              className={`px-4 py-2 rounded-md font-semibold text-white ${
                loading || !fullName.trim() || !email.trim() || !planId.trim() || !amount
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#C29307] hover:bg-[#a57d05]"
              }`}
            >
              {loading ? "Processing..." : "Continue to Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function SubscribePageSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscribePage />
    </Suspense>
  );
}
