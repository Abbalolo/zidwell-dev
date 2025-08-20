"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "./ui/button";

export default function SignReceiptForm({
  token,
  signeeEmail,
  signeeName,
}: {
  token: string;
  signeeEmail: string;
  signeeName: string;
}) {
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");

  const handleSubmit = async () => {
    setNameError("");
    setCodeError("");

    const trimmedName = name.trim();
    const trimmedCode = verificationCode.trim();

    let hasError = false;

    if (!trimmedName) {
      setNameError("Please enter your full name.");
      hasError = true;
    } 
    // else if (trimmedName.toLowerCase() !== signeeName.toLowerCase()) {
    //   setNameError(`Name does not match the expected signee name `);
    //   hasError = true;
    // }

    if (!trimmedCode) {
      setCodeError("Verification code is required.");
      hasError = true;
    }
    if (trimmedCode.length !== 6) {
      setCodeError("Wrong verification code.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const res = await fetch("/api/sign-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: trimmedName,
          signeeEmail,
          signeeName,
          verificationCode: trimmedCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSigned(true);
        Swal.fire({
          icon: "success",
          title: "Receipt Signed",
          text: "You have successfully signed the receipt.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Signing Failed",
          text: data.message || "Failed to sign the receipt. Please try again.",
        });
      }
    } catch (err) {
      // console.error(err);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Something went wrong while signing. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (signed) {
    return <p className="text-green-600 font-semibold">✅ Thank you for signing.</p>;
  }

  return (
    <div className="mt-8">
      <label className="block mb-2 font-semibold">
        Type your full name to sign:
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`border rounded px-3 py-2 w-full mb-1 ${nameError ? "border-red-500" : ""}`}
        placeholder="Your Full Name"
      />
      {nameError && <p className="text-red-500 text-sm mb-3">{nameError}</p>}

      <label className="block mb-2 font-semibold">
        Enter verification code:
      </label>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        className={`border rounded px-3 py-2 w-full mb-1 ${codeError ? "border-red-500" : ""}`}
        placeholder="Verification Code"
      />
      {codeError && <p className="text-red-500 text-sm mb-3">{codeError}</p>}

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
        Sign receipt
      </Button>
    </div>
  );
}
