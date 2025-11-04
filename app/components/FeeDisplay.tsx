"use client";
import React, { useEffect } from "react";
import { calculateFees, formatNaira } from "@/lib/fee";

type Props = {
  type: "transfer" | "deposit" | "card";
  amount?: number;
  paymentMethod?: "checkout" | "virtual_account" | "bank_transfer";
  onFeeCalculated?: (fee: number, total: number) => void; // ✅ new prop
};

export default function FeeDisplay({
  type,
  amount,
  paymentMethod = "checkout",
  onFeeCalculated,
}: Props) {
  const feeDetails = amount
    ? calculateFees(amount, type, paymentMethod)
    : undefined;

  // ✅ Pass calculated fee up to parent when amount changes
  useEffect(() => {
    if (feeDetails && onFeeCalculated) {
      onFeeCalculated(feeDetails.totalFee, feeDetails.totalDebit);
    }
  }, [amount, feeDetails, onFeeCalculated]);

  return (
    <div className="text-sm text-gray-700">
      {feeDetails && (
        <div className="text-sm text-gray-800 space-y-1">
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
