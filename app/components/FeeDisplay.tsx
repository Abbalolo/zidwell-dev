// components/FeeDisplay.tsx
"use client";
import React from "react";
import { calculateFees, formatNaira } from "@/lib/fee"; 

type Props = {
  type: "transfer" | "deposit" | "card";
  amount?: number;
  paymentMethod?: "checkout" | "virtual_account" | "bank_transfer";
};

export default function FeeDisplay({ type, amount, paymentMethod = "checkout" }: Props) {
  // Get fee details if amount is provided
  const feeDetails = amount
    ? calculateFees(amount, type, paymentMethod)
    : undefined;

  // Generate description based on payment method
  const getFeeDescription = () => {
    switch (paymentMethod) {
      case "checkout":
        return "Card payment: 1.6% fee capped at ₦20,000";
      case "virtual_account":
        return "Virtual Account: 0.5% fee (₦10 min, ₦2000 max)";
      case "bank_transfer":
        return "Bank Transfer: 0.5% fee (₦20 min, ₦2000 max)";
      default:
        return "Transaction fee";
    }
  };

  return (
    <div className="text-sm text-gray-700">
      {!amount && (
        <p className="text-xs text-gray-500">
          {getFeeDescription()}
          {/* {type === "transfer" && " + 0.5% transfer fee"} */}
        </p>
      )}

      {feeDetails && (
        <div className="text-sm text-gray-800 space-y-1">
          <p className="text-xs text-gray-600">
            {getFeeDescription()}
          </p>
          <div className="border-t pt-1 mt-1">
            <p className="font-semibold">
              Total fee: <span>{formatNaira(feeDetails.totalFee)}</span>
            </p>
            <p className="font-bold text-green-600">
              Total amount: <span>{formatNaira(feeDetails.totalDebit)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}