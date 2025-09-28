"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useUserContextData } from "../context/userData";
import Link from "next/link";

export default function Withdraw() {
  const [withdrawType, setWithdrawType] = useState("my-account");
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [narration, setNarration] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [walletDetails, setWalletDetails] = useState<any>(null);
  const [p2pDetails, setP2pDetails] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const { userData } = useUserContextData();

  // 🔁 Fetch user's saved account details
  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/get-business-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });

        const data = await res.json();
        setUserDetails(data);
      } catch (error) {
        console.error("Error fetching account details:", error);
      }
    };

    fetchAccountDetails();
  }, [userData?.id]);

  // 🔍 Lookup account name when entering 10 digits
 useEffect(() => {
  if (withdrawType !== "other-bank") return;
  if (accountNumber.length !== 10 || !bankCode) return;

  const timeout = setTimeout(async () => {
    setLookupLoading(true);
    try {
      const res = await fetch("/api/bank-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode, accountNumber }),
      });

      const data = await res.json();
      console.log("Bank lookup result:", data);

      if (res.ok && data?.data?.accountName) {
        setAccountName(data.data.accountName);
      } else {
        setAccountName("");
        Swal.fire(
          "Error",
          data?.message || "Account lookup failed.",
          "error"
        );
      }
    } catch (err: any) {
      setAccountName("");
      Swal.fire(
        "Error",
        err?.message || "Could not verify account.",
        "error"
      );
    } finally {
      setLookupLoading(false);
    }
  }, 700); 

  return () => clearTimeout(timeout); 
}, [accountNumber, bankCode, withdrawType]);


  useEffect(() => {
    if (withdrawType !== "p2p") return;
    if (!recipientEmail || !recipientEmail.includes("@")) return;

    const timeout = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await fetch("/api/find-user-wallet-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: recipientEmail }),
        });

        const data = await res.json();

        if (res.ok && (data.receiverName || data.full_name)) {
          setP2pDetails({
            name: data.receiverName || data.full_name,
            id: data.walletId,
          });
        } else {
          setAccountName("");
          console.log("Error:", data.message || "User lookup failed.");
        }
      } catch (err: any) {
        console.log("Error:", err.message || "Could not verify user.");
      } finally {
        setLookupLoading(false);
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [recipientEmail, withdrawType]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        if (!res.ok) throw new Error("Failed to fetch banks");
        const data = await res.json();
        console.log("✅ Banks:", data);

        setBanks(data.data);
      } catch (err) {
        console.error("Error fetching banks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

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
        setWalletDetails(data);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchAccountDetails();
  }, [userData?.id]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!amount) {
      Swal.fire("Error", "Please enter an amount.", "error");
      return;
    }

    let payload: any = {
      userId: userData?.id,
      amount: Number(amount),
      narration,
      type: withdrawType,
    };

    if (withdrawType === "my-account") {
      if (!userDetails?.bank_code || !userDetails?.bank_account_number) {
        Swal.fire("Error", "Your bank details are incomplete.", "error");
        return;
      }
      payload.bankCode = userDetails.bank_code;
      payload.accountNumber = userDetails.bank_account_number;
      payload.accountName = userDetails.bank_account_name;
    }

    if (withdrawType === "other-bank") {
      if (!bankCode || !accountNumber || !accountName) {
        Swal.fire("Error", "Please complete all bank fields.", "error");
        return;
      }
      payload.bankCode = bankCode;
      payload.accountNumber = accountNumber;
      payload.accountName = accountName;
    }

    if (withdrawType === "p2p") {
      const res = await fetch("/api/p2p-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          receiverAccountId: p2pDetails?.id,
          amount: Number(amount),
          narration,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Success", "P2P Transfer Successful", "success");
        setLoading(false);
      } else {
        Swal.fire(" Error", data.message || "P2P Transfer failed", "error");
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/withdraw-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Success 🎉", "Withdrawal request submitted!", "success");
        setAmount("");
        setAccountNumber("");
        setAccountName("");
        setNarration("");
        setRecipientEmail("");

        window.location.reload()
        setLoading(false);
      } else {
        Swal.fire("Error", data.message || "Withdrawal failed.", "error");
        setLoading(false);
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="shadow-xl border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Withdraw Funds
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how you want to withdraw funds from your wallet.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleWithdraw} className="space-y-6">
          {/* 🔀 Withdrawal Type */}
          <div className="space-y-2">
            <Label>Withdrawal Type</Label>
            <Select onValueChange={setWithdrawType} value={withdrawType}>
              <SelectTrigger>
                <SelectValue placeholder="Select withdrawal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="my-account">My Bank Account</SelectItem>
                <SelectItem value="other-bank">Other Bank Account</SelectItem>
                <SelectItem value="p2p">Zidwell User (P2P)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>

          {/* 💳 My Bank Account */}
          {withdrawType === "my-account" &&
            (userDetails ? (
              <div className="bg-gray-50 p-3 rounded-lg border space-y-1 text-sm">
                <p>
                  <strong>Bank:</strong> {userDetails.bank_name}
                </p>
                <p>
                  <strong>Account Number:</strong>{" "}
                  {userDetails.bank_account_number}
                </p>
                <p>
                  <strong>Account Name:</strong> {userDetails.bank_account_name}
                </p>
              </div>
            ) : (
              <div className="bg-red-50 p-3 rounded-lg border text-sm text-red-600">
                You have not set your bank account details yet.{" "}
                <Link
                  href="/dashboard/profile"
                  className="text-blue-500 hover:underline"
                >
                  Click here
                </Link>{" "}
                to add them.
              </div>
            ))}

          {/* 🏦 Other Bank */}
          {withdrawType === "other-bank" && (
            <>
              <div>
                <Label htmlFor="bankName">Select Bank Name</Label>
                <Select
                  value={
                    bankCode
                      ? JSON.stringify({ name: bankName, code: bankCode })
                      : ""
                  }
                  onValueChange={(value) => {
                    try {
                      const selected = JSON.parse(value);
                      setBankName(selected.name || "");
                      setBankCode(selected.code || "");
                    } catch {
                      console.error("Invalid bank data");
                    }
                  }}
                >
                  <SelectTrigger id="bankName">
                    <SelectValue placeholder="Select a bank name" />
                  </SelectTrigger>

                  <SelectContent>
                    {banks?.length > 0 ? (
                      banks.map((bank) => (
                        <SelectItem
                          key={bank.code}
                          value={JSON.stringify({
                            name: bank.name,
                            code: bank.code,
                          })}
                        >
                          {bank.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="no-banks">
                        No banks available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="10-digit account number"
                  required
                />
              </div>

              {lookupLoading ? (
                <p className="text-blue-600 text-sm">🔍 Verifying account...</p>
              ) : (
                accountName && (
                  <p className="text-green-600 text-sm font-semibold">
                    Account Name: {accountName}
                  </p>
                )
              )}
            </>
          )}

          {/* 👤 P2P */}
          {withdrawType === "p2p" && (
            <>
              <div className="space-y-2">
                <Label>Recipient Email (App User)</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              {p2pDetails?.name && (
                <p className="text-green-600 text-sm font-semibold">
                  Account Name: {p2pDetails.name}
                </p>
              )}
            </>
          )}

          {/* 📝 Narration */}
          <div className="space-y-2">
            <Label>Narration (optional)</Label>
            <Input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. Wallet withdrawal"
            />
          </div>

          {/* 📤 Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C29307] hover:bg-[#b28a06] text-white md:w-[200px]"
          >
            {loading ? "Processing..." : "Withdraw Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
