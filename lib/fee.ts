// lib/fees.ts
export type FeeResult = {
  nombaFee: number;
  appFee: number;
  totalFee: number;
  totalDebit: number;
};

/**
 * Calculate fees
 * - monthlyVolume: total deposit+withdrawal+card for user this month
 * - type: "withdrawal" | "deposit" | "card"  (withdrawals get app fee)
 */
export function calculateFees(
  amount: number,
  monthlyVolume: number,
  type: "withdrawal" | "deposit" | "card"
): FeeResult {
  const am = Number(amount) || 0;
  // base nomba fee = 1% of amount
  let nombaFee = am * 0.01;

  // min fee ₦10
  nombaFee = Math.max(nombaFee, 10);

  // cap depends on monthlyVolume
  const cap = monthlyVolume > 30000 ? 50 : 150;
  nombaFee = Math.min(nombaFee, cap);

  let appFee = 0;
  if (type === "withdrawal") {
    appFee = am * 0.0075; // 0.75%
  }

  const totalFee = nombaFee + appFee;
  const totalDebit = am + totalFee;

  // round to 2 decimals
  return {
    nombaFee: Math.round(nombaFee * 100) / 100,
    appFee: Math.round(appFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    totalDebit: Math.round(totalDebit * 100) / 100,
  };
}

// currency formatter ₦1,000.00
export const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
