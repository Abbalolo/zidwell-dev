"use client";

import { useState, useEffect } from "react";
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
import Swal from "sweetalert2";

interface Bank {
  name: string;
  code: string;
}

interface P2PDetails {
  name: string;
  id: string;
}

export default function Withdraw() {
  const [withdrawType, setWithdrawType] = useState<
    "my-account" | "other-bank" | "p2p"
  >("my-account");
  const [amount, setAmount] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [narration, setNarration] = useState<string>("");
  const [recepientAcc, setRecepientAcc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [walletDetails, setWalletDetails] = useState<any>(null);
  const [p2pDetails, setP2pDetails] = useState<P2PDetails | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { userData } = useUserContextData();

  // Fetch user and wallet details
  useEffect(() => {
    if (!userData?.id) return;

    const fetchDetails = async () => {
      try {
        const [accountRes, walletRes, banksRes] = await Promise.all([
          fetch("/api/get-business-account-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userData.id }),
          }),
          fetch("/api/get-wallet-account-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userData.id }),
          }),
          fetch("/api/banks"),
        ]);

        const accountData = accountRes.ok ? await accountRes.json() : {};
        const walletData = walletRes.ok ? await walletRes.json() : {};
        const banksData = banksRes.ok ? await banksRes.json() : {};

        setUserDetails(accountData || {});
        setWalletDetails(walletData || {});
        setBanks(banksData?.data || []);
      } catch (err) {
        console.error("Error fetching details:", err);
      }
    };

    fetchDetails();
  }, [userData?.id]);

  // Bank account lookup
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

        const data = res.ok ? await res.json() : null;
        const acctName = data?.data?.accountName;

        if (acctName) {
          setAccountName(acctName);
          setErrors((prev) => ({ ...prev, accountNumber: "" }));
        } else {
          setAccountName("");
          setErrors((prev) => ({
            ...prev,
            accountNumber: data?.message || "Account lookup failed.",
          }));
        }
      } catch (err: any) {
        setAccountName("");
        setErrors((prev) => ({
          ...prev,
          accountNumber: err?.message || "Could not verify account.",
        }));
      } finally {
        setLookupLoading(false);
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [accountNumber, bankCode, withdrawType]);

  // P2P user lookup
  useEffect(() => {
    if (withdrawType !== "p2p") return;
    if (!recepientAcc || recepientAcc.length < 6) return;

    if (recepientAcc === userData?.walletAccountNumber) {
      setP2pDetails(null);
      setErrors((prev) => ({
        ...prev,
        recepientAcc: "You cannot transfer to your own account.",
      }));
      return;
    }

    const timeout = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await fetch("/api/find-user-wallet-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accNumber: recepientAcc }),
        });

        const data = res.ok ? await res.json() : null;
        

        if (data?.receiverName || data?.full_name) {
          setP2pDetails({
            name: data.receiverName || data.full_name,
            id: data.walletId,
          });
          setErrors((prev) => ({ ...prev, recepientAcc: "" }));
        } else {
          setP2pDetails(null);
          setErrors((prev) => ({
            ...prev,
            recepientAcc: data?.message || "User not found.",
          }));
        }
      } catch (err: any) {
        setP2pDetails(null);
        setErrors((prev) => ({
          ...prev,
          recepientAcc: err?.message || "Could not verify account.",
        }));
      } finally {
        setLookupLoading(false);
      }
    }, 400); // delay for smoother UX

    return () => clearTimeout(timeout);
  }, [recepientAcc, withdrawType]);

  // Withdraw submission
  const handleWithdraw = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const newErrors: { [key: string]: string } = {};

  // ✅ Validation checks
  if (!amount || Number(amount) <= 0) newErrors.amount = "Enter a valid amount.";
  if (!narration) newErrors.narration = "Narration is required.";
  if (narration.length > 100) newErrors.narration = "Narration too long.";

  if (
    withdrawType === "my-account" &&
    (!userDetails?.bank_account_number || !userDetails?.bank_account_name)
  ) {
    newErrors.myAccount = "Your bank details are incomplete.";
  }

  if (withdrawType === "other-bank") {
    if (!bankCode || !accountNumber || !accountName) {
      newErrors.otherBank = "Please complete all bank fields.";
    }
    if (
      accountNumber &&
      (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber))
    ) {
      newErrors.accountNumber = "Account number must be 10 digits.";
    }
  }

  if (withdrawType === "p2p" && (!recepientAcc || !p2pDetails?.id)) {
    newErrors.recepientAcc = "Recipient not found or invalid.";
  }

  // ✅ If validation fails - show all errors in SweetAlert
  if (Object.keys(newErrors).length > 0) {
    const errorMessages = Object.values(newErrors).join("<br>");
    Swal.fire({
      icon: "error",
      title: "Validation Failed",
      html: errorMessages,
    });
    setErrors(newErrors);
    setLoading(false);
    return;
  }

  try {
    // ✅ Prepare payload
    const payload: any = {
      userId: userData?.id,
      amount: Number(amount),
      narration,
      type: withdrawType,
    };

    if (withdrawType === "my-account") {
      payload.bankCode = userDetails.bank_code;
      payload.accountNumber = userDetails.bank_account_number;
      payload.accountName = userDetails.bank_account_name;
    }

    if (withdrawType === "other-bank") {
      payload.bankCode = bankCode;
      payload.accountNumber = accountNumber;
      payload.accountName = accountName;
    }

    if (withdrawType === "p2p") {
      payload.receiverAccountId = p2pDetails?.id;
    }

    const endpoint =
      withdrawType === "p2p" ? "/api/p2p-transfer" : "/api/withdraw-balance";

    // ✅ Make API call
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Success Alert
      Swal.fire({
        icon: "success",
        title: "Withdrawal Successful",
        text: "Your transaction has been processed successfully.",
      });

      // Reset fields
      setAmount("");
      setAccountNumber("");
      setAccountName("");
      setNarration("");
      setRecepientAcc("");
      setErrors({});
    } else {
      // ❌ Server error
      Swal.fire({
        icon: "error",
        title: "Withdrawal Failed",
        text: data?.message,
      });
     
      setErrors({ form: data?.message || "Withdrawal failed." });
    }
  } catch (err: any) {
    // ❌ Catch error
    Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: err?.message || "Please try again later.",
    });
    
    setErrors({ form: err?.message || "Something went wrong." });
  } finally {
    setLoading(false);
  }
};


  const isDisabled =
    loading ||
    !amount ||
    !narration ||
    Number(amount) <= 0 ||
    (withdrawType === "my-account" && !userDetails?.bank_account_number) ||
    (withdrawType === "other-bank" &&
      (!bankCode || !accountNumber || !accountName)) ||
    (withdrawType === "p2p" && (!recepientAcc || !p2pDetails?.id));

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
          {/* Withdrawal Type */}
          <div className="space-y-2">
            <Label>Withdrawal Type</Label>
            <Select
              onValueChange={(v) => setWithdrawType(v as any)}
              value={withdrawType}
            >
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

          {/* Amount */}
          <div className="space-y-1">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
            {errors.amount && (
              <p className="text-red-600 text-sm">{errors.amount}</p>
            )}
          </div>

          {/* My Bank Account */}
          {withdrawType === "my-account" &&
            (userDetails?.bank_account_number &&
            userDetails?.bank_account_name ? (
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
                {errors.myAccount && (
                  <p className="text-red-600 text-sm">{errors.myAccount}</p>
                )}
              </div>
            ))}

          {/* Other Bank */}
          {withdrawType === "other-bank" && (
            <>
              <div className="space-y-1">
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
                    } catch {}
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
                {errors.otherBank && (
                  <p className="text-red-600 text-sm">{errors.otherBank}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Account Number</Label>
                <Input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="10-digit account number"
                />
                {errors.accountNumber && (
                  <p className="text-red-600 text-sm">{errors.accountNumber}</p>
                )}
              </div>

              {lookupLoading && (
                <p className="text-blue-600 text-sm">🔍 Verifying account...</p>
              )}
              {accountName && !errors.accountNumber && (
                <p className="text-green-600 text-sm font-semibold">
                  Account Name: {accountName}
                </p>
              )}
            </>
          )}

          {/* P2P */}
          {withdrawType === "p2p" && (
            <div className="space-y-1">
              <Label>Account Number (Zidwell User)</Label>
              <Input
                type="text"
                value={recepientAcc}
                onChange={(e) => setRecepientAcc(e.target.value)}
                placeholder="0234******"
              />
              {errors.recepientAcc && (
                <p className="text-red-600 text-sm">{errors.recepientAcc}</p>
              )}
              {lookupLoading && (
                <p className="text-blue-600 text-sm">🔍 Verifying account...</p>
              )}
              {p2pDetails?.name && !errors.recepientAcc && (
                <p className="text-green-600 text-sm font-semibold">
                  Account Name: {p2pDetails.name}
                </p>
              )}
            </div>
          )}

          {/* Narration */}
          <div className="space-y-1">
            <Label>
              Narration{" "}
              <span className="text-sm">(purpose of transaction)</span>
            </Label>
            <Input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. Food"
              maxLength={100}
            />
          </div>
          {errors.narration && (
            <p className="text-red-600 text-sm">{errors.narration}</p>
          )}

      
          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-[#C29307] hover:bg-[#b28a06] text-white md:w-[200px]"
          >
            {loading ? "Processing..." : "Withdraw Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
