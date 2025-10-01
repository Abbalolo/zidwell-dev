"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useUserContextData } from "../context/userData";
import { Banknote, Check, Copy, CopyIcon, Landmark, Wallet } from "lucide-react";
import TransactionHistory from "./transaction-history";
import ExpiryTimer from "./ExpiryTimer";

export default function FundAccountMethods() {
const [copyText, setCopyText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const { userData, balance } = useUserContextData();



  const generateVirtualAccountNumber = async () => {
    if (!userData) {
      console.error("Missing user data.");
      return null;
    }

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
      console.log(data, "account");
      setLoading(false);

      if (response.ok && data.success) {
        return data;
      } else {
        console.error("Error generating account number:", data.error);
        return null;
      }
    } catch (error) {
      setLoading(false);
      console.error("Error during API call:", error);
      return null;
    }
  };

  const handleDeposit = async () => {
    try {
      const newAccountDetails = await generateVirtualAccountNumber();
      if (newAccountDetails) {
        setAccountDetails(newAccountDetails);
      }
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

      setTimeout(() => {
        setCopyText(false);
      }, 3000);
    }
  };
    

  return (
    <div className="space-y-6">
      {/* <div className="w-full flex justify-end items-end">
        <Button
          className="bg-[#C29307]"
          onClick={handleDeposit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Quick Fund"}
        </Button>
      </div> */}

      {/* Account Balance Card */}
      <div className="flex flex-col md:flex-row gap-3">
        <Card className=" bg-[#C29307] text-white flex items-center justify-between">
          <CardHeader>
            <CardTitle className="text-base md:text-lg ">
              <div className="flex flex-col items-start">
                Account Balance
                <span className=" font-semibold">
                  ₦{formatNumber(balance ?? 0)}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
           <Wallet className="md:text-2xl"/>
          </CardContent>
        </Card>

        <Card className="flex items-center justify-between text-gray-600 ">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              <div className="flex flex-col items-start ">
                Your Account Balance
                <div className="font-semibold text-black flex items-center gap-4">
                  {details?.bank_account_number} <Button className="text-sm" variant="outline" onClick={handleCopyReferral}>
                    {copyText ? "Copied" : <CopyIcon className="w-4 h-4" />}
                  </Button>
                </div>

                {details?.bank_name}
              </div>
            </CardTitle> 
          </CardHeader>
          <CardContent>
            <Landmark className="md:text-2xl"/>
          </CardContent>
        </Card>
      </div>

      {/* Virtual Account Details */}
       
    
   

      <TransactionHistory  />
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