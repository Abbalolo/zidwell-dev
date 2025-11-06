"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useUserContextData } from "../context/userData";
import { CopyIcon, Eye, EyeOff, Landmark, Wallet, X } from "lucide-react";
import TransactionHistory from "./transaction-history";
import { Input } from "./ui/input";

export default function FundAccountMethods() {
  const [copyText, setCopyText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState<number | string>("");
  const [showLifetime, setShowLifetime] = useState(true);
  const [showCurrent, setShowCurrent] = useState(true);
  const { userData, balance, lifetimeBalance } = useUserContextData();


  const generateVirtualAccountNumber = async () => {
    if (!userData) return null;
    const payload = {
      userId: userData.id,
      first_name: userData.firstName,
      last_name: userData.lastName,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/generate-virtual-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);
      if (response.ok && data.success) return data;
      console.error("Error generating account number:", data.error);
      return null;
    } catch (error) {
      setLoading(false);
      console.error("Error during API call:", error);
      return null;
    }
  };

  const handleDeposit = async () => {
    try {
      const newAccountDetails = await generateVirtualAccountNumber();
      if (newAccountDetails) setAccountDetails(newAccountDetails);
    } catch (error) {
      alert(error);
    }
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!userData?.id) return;
      try {
        const res = await fetch("/api/get-wallet-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        const data = await res.json();
        setDetails(data);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchAccountDetails();
  }, [userData?.id]);

  const handleCopyReferral = async () => {
    if (details) {
      setCopyText(true);
      await navigator.clipboard.writeText(details?.bank_account_number);
      setTimeout(() => setCopyText(false), 3000);
    }
  };

  const initializePayment = async () => {
    if (!amount || Number(amount) < 100) {
      alert("Please enter an amount of at least ₦100.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/fund-account-debit-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "initialize",
        amount: Number(amount),
        email: userData?.email,
        reference: `TXN_${Date.now()}`,
        userId: userData?.id,
      }),
    });

    const data = await res.json();
    setLoading(false);
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* ✅ Quick Fund Button */}
      {/* <div className="w-full flex justify-end items-end">
        <Button
          className="bg-[#C29307]"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          {loading ? "Processing..." : "Deposit with Card"}
        </Button>
      </div> */}

      {/* 💳 Account Balance */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Lifetime Balance */}
        <Card className="bg-gradient-to-r from-[#C29307] to-[#E3A521] text-white flex items-center justify-between shadow-lg rounded-xl p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base md:text-lg font-medium">
              Lifetime Balance
              <span className="block font-semibold text-xl mt-1">
                {showLifetime ? `₦${formatNumber(lifetimeBalance)}` : "*****"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <button
              onClick={() => setShowLifetime((prev) => !prev)}
              className="bg-white/20 p-3 rounded-full"
            >
              {showLifetime ? (
                <EyeOff className="text-white md:text-2xl" />
              ) : (
                <Eye className="text-white md:text-2xl" />
              )}
            </button>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card className="bg-gradient-to-r from-gray-600 to-gray-800 text-white flex items-center justify-between shadow-lg rounded-xl p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base md:text-lg font-medium">
              Current Balance
              <span className="block font-semibold text-xl mt-1">
                {showCurrent ? `₦${formatNumber(balance ?? 0)}` : "*****"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <button
              onClick={() => setShowCurrent((prev) => !prev)}
              className="bg-white/20 p-3 rounded-full"
            >
              {showCurrent ? (
                <EyeOff className="text-white md:text-2xl" />
              ) : (
                <Eye className="text-white md:text-2xl" />
              )}
            </button>
          </CardContent>
        </Card>

        {/* Account Number */}
        <Card className="flex items-center justify-between text-gray-700 bg-white border shadow-md rounded-xl p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base md:text-lg font-medium">
              Your Account Number
              <div className="font-semibold text-black flex items-center gap-4 mt-1">
                {details?.bank_details.bank_account_number}
                <button
                  className="text-sm border px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition"
                  onClick={handleCopyReferral}
                >
                  {copyText ? "Copied" : <CopyIcon className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500">{details?.bank_details.bank_name}</p>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-gray-100 p-3 rounded-full">
              <Landmark className="md:text-2xl text-gray-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📜 Transaction History */}
      <TransactionHistory />

      {/* 💰 Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 w-[90%] max-w-md shadow-xl relative border border-gray-200">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">
              Enter Amount to Deposit
            </h2>

            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full p-3 border rounded-lg mb-4 text-center focus:outline-none focus:ring-2 focus:ring-[#C29307]"
              min={100}
            />

            <Button
              className="w-full bg-[#C29307] text-white"
              disabled={loading || !amount}
              onClick={initializePayment}
            >
              {loading ? "Redirecting..." : `Deposit ₦${amount || 0}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// {accountDetails && accountDetails.success && (
//       <Card>
//         <CardHeader>
//           <CardTitle>Virtual Account Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {/* Account Number */}
//             <div className="flex justify-between items-center">
//               <span className="text-gray-600">Account Number:</span>
//               <div className="flex gap-3 items-center">
//                 <span className="font-mono">
//                   {accountDetails.account.bankAccountNumber}
//                 </span>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() =>
//                     copyToClipboard(
//                       accountDetails.account.bankAccountNumber,
//                       "account"
//                     )
//                   }
//                 >
//                   {copied === "account" ? (
//                     <Check className="w-4 h-4" />
//                   ) : (
//                     <Copy className="w-4 h-4" />
//                   )}
//                 </Button>
//               </div>
//             </div>

//             {/* Bank Name */}
//             <div className="flex justify-between items-center">
//               <span className="text-gray-600">Bank Name:</span>
//               <span>{accountDetails.account.bankName}</span>
//             </div>

//             {/* Expiry Date with Timer */}
//             <div className="flex justify-between items-center">
//               <span className="text-gray-600">Expires In:</span>
//               <ExpiryTimer expiryDate={accountDetails.account.expiryDate} />
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )}
