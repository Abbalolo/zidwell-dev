"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "./ui/button";

export default function SignContractForm({
  token,
  signeeEmail,
}: {
  token: string;
  signeeEmail: string;
}) {
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Name",
        text: "Please type your full name to sign the contract.",
      });
      return;
    }

    if (!verificationCode.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Verification Code",
        text: "Please enter the verification code you received by email.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/sign-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signeeEmail, signeeName: name.trim() , verificationCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setSigned(true);
        Swal.fire({
          icon: "success",
          title: "Contract Signed",
          text: "You have successfully signed the contract.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Signing Failed",
          text:
            data.message || "Failed to sign the contract. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (signed) {
    return (
      <p className="text-green-600 font-semibold">Thank you for signing.</p>
    );
  }

  return (
    <div>
      <label className="block mb-2 font-semibold">
        Type your full name to sign:
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Your Full Name"
      />

      <label className="block mb-2 font-semibold">
        Enter verification code:
      </label>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Verification Code"
      />

      <Button
        disabled={loading}
        className="bg-[#C29307] hover:bg-[#b28a06] text-white flex items-center"
        onClick={handleSubmit}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Sign Contract
      </Button>
    </div>
  );
}
