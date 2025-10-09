// components/FeeDisplay.tsx
"use client";
import React from "react";
import { calculateFees, formatNaira } from "@/lib/fee"; 

type Props = {
  monthlyVolume: number; // deposit+withdrawal+card
  type: "withdrawal" | "deposit" | "card";
  amount?: number; 
};

export default function FeeDisplay({ monthlyVolume, type, amount }: Props) {
  // textual rule
  const capText = monthlyVolume > 30000 ? "₦50" : "₦150";
  const feeRule = `1% fee (min ₦10, cap ${capText})`;
  const appFeeText = type === "withdrawal" ? " + App fee 0.75%" : "";

  // numeric breakdown if amount provided
  const feeDetails = amount
    ? calculateFees(amount, monthlyVolume, type)
    : undefined;

  return (
    <div className="text-sm text-gray-700 mt-2">
      {/* <p className="text-xs text-gray-500">
        Note: {feeRule}
        {appFeeText}
      </p> */}

      {feeDetails && (
        <div className="mt-2 text-sm text-gray-800">
          {/* <p>
            Nomba fee: <span className="font-semibold">{formatNaira(feeDetails.nombaFee)}</span>
          </p>
          {type === "withdrawal" && (
            <p>
              App fee (0.75%): <span className="font-semibold">{formatNaira(feeDetails.appFee)}</span>
            </p>
          )} */}
          <p className="font-semibold">
            Total fee: <span>{formatNaira(feeDetails.totalFee)}</span>
          </p>
          <p className="font-bold">
            Total to debit: <span>{formatNaira(feeDetails.totalDebit)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
