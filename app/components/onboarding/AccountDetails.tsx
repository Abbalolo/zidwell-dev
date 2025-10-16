"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ArrowRight, ArrowLeft, SkipForward } from "lucide-react";

interface AccountDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

interface AccountDetailsStepProps {
  data: AccountDetails;
  onUpdate: (data: Partial<AccountDetails>) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  userData: any;
}

export const AccountDetailsStep = ({
  data,
  onUpdate,
  onNext,
  onPrev,
  onSkip,
}: AccountDetailsStepProps) => {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof AccountDetails, value: string) => {
    onUpdate({ [field]: value });
  };

  const isDataComplete =
    data.bankName && data.bankCode && data.accountNumber && data.accountName;

  useEffect(() => {
    const fetchBanks = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/banks");
        const result = await res.json();
        console.log("Fetched banks:", result);
        setBanks(result?.data || []);
      } catch (err) {
        console.error("Error fetching banks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-xl shadow-sm p-6 border">
      <h2 className="text-2xl font-semibold mb-2 text-center">
       Account Withdrawal Details

      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Provide a bank account details that match your name, where you can withdraw your funds to whenever you want to withdraw from your Zidwell wallet.
      </p>

      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading bank list...</p>
      ) : (
        <div className="space-y-4">
          {/* Bank Name */}
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Select
              value={
                data.bankName && data.bankCode
                  ? JSON.stringify({
                      name: data.bankName,
                      code: data.bankCode,
                    })
                  : ""
              }
              onValueChange={(value) => {
                try {
                  const selected = JSON.parse(value);
                  handleInputChange("bankName", selected.name || "");
                  handleInputChange("bankCode", selected.code || "");
                } catch {
                  console.error("Invalid bank data");
                }
              }}
            >
              <SelectTrigger id="bankName">
                <SelectValue placeholder="Select a bank" />
              </SelectTrigger>
              <SelectContent>
                {banks?.length > 0 ? (
                  banks.map((bank) => (
                    <SelectItem
                      key={bank.code}
                      value={JSON.stringify({ name: bank.name, code: bank.code })}
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

          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              value={data.accountNumber}
              onChange={(e) =>
                handleInputChange("accountNumber", e.target.value)
              }
            />
          </div>

          {/* Account Name */}
          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              placeholder="Enter account name"
              value={data.accountName}
              onChange={(e) => handleInputChange("accountName", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-8">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip for now
          </Button>

          {isDataComplete && (
            <Button
              onClick={onNext}
              className="bg-[#C29307] hover:opacity-100 transition-smooth flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsStep;
