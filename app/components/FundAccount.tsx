"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useUserContextData } from "../context/userData";
import { Check, Copy } from "lucide-react";
import TransactionHistory from "./transaction-history";

export default function FundAccountMethods() {
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const { userData } = useUserContextData();

  const copyToClipboard = async (text: any, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Function to call the backend API
  const generateVirtualAccountNumber = async () => {
    // Ensure userData exists and the amount is provided
    if (!userData || !amount) {
      console.error("Missing user data or amount.");
      return null;
    }

    // Prepare payload with user data and amount
    const payload = {
      userId: userData.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      amount,
    };

    console.log("Sending fund data:", payload);

    try {
      // Make the API call to generate the virtual account number
      const response = await fetch("/api/generate-virtual-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Handle successful response
        const data = await response.json();
        console.log("Generated account details:", data);
        return data;
      } else {
        // Handle response errors
        const errorData = await response.json();
        console.error("Error generating account number:", errorData.error);
        throw new Error(errorData.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Error during API call:", error);
      return null;
    }
  };

  const handleQuickFund = () => {
    // Show the input field when "Quick Fund" is clicked
    setShowInput(true);
  };

  const handleDeposit = async () => {
    try {
      // Call the backend to generate the virtual account details
      const newAccountDetails = await generateVirtualAccountNumber();

      if (newAccountDetails && newAccountDetails.success) {
        console.log("Account details received:", newAccountDetails);
        setAccountDetails(newAccountDetails); // Store the entire account details object
      } else {
        console.error("No account details found or success is false.");
      }

      setAmount(""); // Clear the amount input after submission
      setShowInput(false); // Hide the input field
    } catch (error) {
      alert(error); // Show error if something went wrong
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Account Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-lg md:text-2xl font-semibold">
              ₦{formatNumber(userData?.walletBalance ?? 0)}
            </span>
            <Button className="bg-[#C29307]" onClick={handleQuickFund}>
              Quick Fund
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Show input field when Quick Fund is clicked */}
      {showInput && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Amount to Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <p className="text-sm text-gray-500">Minimum amount: ₦100.00</p>
            </div>
            <div className="flex justify-end mt-4">
              <Button className="bg-[#C29307]" onClick={handleDeposit}>
                OK
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display account details when available */}
      {accountDetails && accountDetails.success && (
        <Card>
          <CardHeader>
            <CardTitle>Virtual Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Account Number */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Number:</span>

                <div className="flex gap-3 items-center">
                  <span className="font-mono">
                    {accountDetails.account.account_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        accountDetails.account.account_number,
                        "account"
                      )
                    }
                  >
                    {copied === "account" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Bank Name */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bank Name:</span>
                <span>{accountDetails.account.bank_name}</span>
              </div>

              {/* Amount */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span>₦{accountDetails.account.amount}</span>
              </div>

              {/* Expiry Date */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expiry Date:</span>
                <span>{accountDetails.account.expiry_date}</span>
              </div>

              {/* Account Status */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span>{accountDetails.account.account_status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <TransactionHistory />
    </div>
  );
}
