"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Receipt, Copy } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useUserContextData } from "../context/userData";
import { useRouter } from "next/navigation";

export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(false);
  const { userData, balance } = useUserContextData();
  const [copyText, setCopyText] = useState(false);
  const router = useRouter();

  const formatNumber = (value: any) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL
      : process.env.NEXT_PUBLIC_BASE_URL;

  // Generate referral link
  const referralLink = userData?.referralCode
    ? `${baseUrl}/auth/signup?ref=${userData.referralCode}`
    : "";

  const handleCopyReferral = async () => {
    if (referralLink) {
      setCopyText(true);
      await navigator.clipboard.writeText(referralLink);

      // alert("Referral link copied to clipboard!");

      setTimeout(() => {
        setCopyText(false);
      }, 3000);
    }
  };


const handleEyeClick = () => {
  const newShowBalance = !showBalance;
  setShowBalance(newShowBalance);
  localStorage.setItem("showBalance", JSON.stringify(newShowBalance));
};

useEffect(() => {
  const storedShowBalance = localStorage.getItem("showBalance");
  if (storedShowBalance !== null) {
    setShowBalance(JSON.parse(storedShowBalance));
  }
}, []);


  return (
    <Card
      className={`shadow-sm ${
        userData?.bvnVerification === "pending" ? "pointer-events-none" : ""
      }`}
    >
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          {/* Balance Section */}
          <div>
            <p className="text-gray-500 text-sm mb-2">Total Balance</p>
            <div className="flex items-center justify-center">
              <h2 className="md:text-3xl text-xl font-bold text-gray-900">
                Available Balance: ₦{" "}
                {showBalance ? formatNumber(balance) : "*****"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEyeClick}
                className="text-gray-400 hover:text-gray-600"
              >
                {showBalance ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {typeof userData?.zidcoinBalance !== "undefined" && (
            <div className="mt-6">
              <p className="text-gray-500 text-sm mb-2">Zidcoin Balance</p>
              <div className="flex items-center justify-center">
                <h2 className="md:text-2xl text-lg font-bold text-gray-900">
                  {showBalance
                    ? formatNumber(userData?.zidcoinBalance)
                    : "*****"}{" "}
                  ZDC
                </h2>
              </div>
            </div>
          )}

          {/* Referral Section */}

          {/* Action Buttons */}
          <div className="flex items-center justify-center md:space-x-4 space-x-2 pt-4">
            <Button
              onClick={() => router.push("/dashboard/fund-account")}
              className="bg-[#C29307] hover:bg-[#C29307] text-white md:px-8 md:py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
            {/* <Button
              variant="outline"
              onClick={() => router.push("/dashboard/transactions")}
              className="md:px-8 md:py-3 bg-transparent"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Transaction
            </Button> */}
            <Button
              variant="outline"
              onClick={() => router.push("dashboard/fund-account/transfer-page")}
              className="md:px-8 md:py-3 bg-transparent"
            >
              <Receipt className="w-4 h-4 mr-2" />
             Transfer Cash
            </Button>
          </div>

          {userData?.referralCode && (

            // pointer-events-none opacity-50
           
            <div className="bg-gray-100 p-4 rounded-lg text-center ">
              <p className="text-gray-700 text-sm mb-2 font-semibold">
                Invite friends & earn rewards 🎉
              </p>
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs"
                />
                <Button
                  variant="outline"
                  // size="icon"
                  onClick={handleCopyReferral}
                >
                  {copyText ? "copied" : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share your link and earn bonuses when friends sign up!
              </p>
            </div>
          
          )}
        </div>
      </CardContent>
    </Card>
  );
}
