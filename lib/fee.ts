export type FeeResult = {
  nombaFee: number;
  appFee: number;
  totalFee: number;
  totalDebit: number;
};

/**
 * Calculate fees based on payment method
 * - amount: transaction amount
 * - type: "transfer" | "deposit" | "card" 
 * - paymentMethod: "checkout" | "virtual_account" | "bank_transfer"
 */
export function calculateFees(
  amount: number,
  type: "transfer" | "deposit" | "card",
  paymentMethod: "checkout" | "virtual_account" | "bank_transfer" = "checkout"
): FeeResult {
  const am = Number(amount) || 0;

  let nombaFee = 0;
  let appFee = 0;

  // Calculate fees based on payment method
  if (paymentMethod === "checkout") {
    // Checkout: Nomba charges 1.4% + ₦1800, we charge same to customer
    const nombaPercentage = am * 0.014; // 1.4%
    nombaFee = nombaPercentage + 1800; // + ₦1800 flat fee
    appFee = nombaFee; // Pass through to customer
  } 
  else if (paymentMethod === "virtual_account") {
    // Virtual Account: Nomba charges 0.5% (₦10 min, ₦100 cap), we charge same
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 10), 100); // Min ₦10, Max ₦100
    appFee = nombaFee; // Pass through to customer
  } 
  else if (paymentMethod === "bank_transfer") {
    // Pay by Transfer: Nomba charges 0.5% (₦20 min, ₦100 cap), we charge same
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 20), 100); // Min ₦20, Max ₦100
    appFee = nombaFee; // Pass through to customer
  }

  // For transfers, add additional 1% app fee (₦20 min, ₦1000 max)
  if (type === "transfer") {
    const transferAppFee = am * 0.01; // 1% additional app fee for transfers
    const transferFee = Math.min(Math.max(transferAppFee, 20), 1000); // Min ₦20, Max ₦1000
    appFee += transferFee;
  }

  const totalFee = appFee;
  const totalDebit = am + totalFee;

  // round to 2 decimals
  return {
    nombaFee: Math.round(nombaFee * 100) / 100,
    appFee: Math.round(appFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    totalDebit: Math.round(totalDebit * 100) / 100,
  };
}

// Alternative function for webhook usage - calculates what we should charge vs what Nomba charges
export function calculateWebhookFees(
  amount: number,
  channel: string,
  txType: string
): { nombaFee: number; ourFee: number; ourMargin: number } {
  console.log(`💰 Webhook fee calculation for amount: ₦${amount}, channel: ${channel}, type: ${txType}`);
  
  let nombaFee = 0;
  let ourFee = 0;

  // Determine which fee structure to apply based on payment method
  if (channel === "card" || txType === "card_deposit") {
    // Checkout: Nomba charges 1.4% + ₦1800, we charge same
    const nombaPercentage = amount * 0.014; // 1.4%
    nombaFee = nombaPercentage + 1800; // + ₦1800 flat fee
    ourFee = nombaFee; // Pass through
    console.log(`   - Nomba Checkout fee (1.4% + ₦1800): ₦${nombaFee}`);
    console.log(`   - Our Checkout fee (same): ₦${ourFee}`);
  } 
  else if (channel === "virtual_account" || txType === "virtual_account_deposit") {
    // Virtual Account: Nomba charges 0.5% (₦10 min, ₦100 cap), we charge same
    const nombaPercentage = amount * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 10), 100); // Min ₦10, Max ₦100
    ourFee = nombaFee; // Pass through
    console.log(`   - Nomba VA fee (0.5%: ₦10 min, ₦100 cap): ₦${nombaFee}`);
    console.log(`   - Our VA fee (same): ₦${ourFee}`);
  } 
  else if (channel === "bank_transfer" || txType === "transfer_deposit") {
    // Pay by Transfer: Nomba charges 0.5% (₦20 min, ₦100 cap), we charge same
    const nombaPercentage = amount * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 20), 100); // Min ₦20, Max ₦100
    ourFee = nombaFee; // Pass through
    console.log(`   - Nomba Transfer fee (0.5%: ₦20 min, ₦100 cap): ₦${nombaFee}`);
    console.log(`   - Our Transfer fee (same): ₦${ourFee}`);
  } 
  else {
    // Default fallback
    console.log(`   - Unknown channel, using zero fees`);
    nombaFee = 0;
    ourFee = 0;
  }

  // For transfers, add additional 1% app fee (₦20 min, ₦1000 max)
  if (txType.includes("transfer") || txType.includes("withdrawal")) {
    const transferAppFee = amount * 0.01; // 1% additional app fee for transfers
    const transferFee = Math.min(Math.max(transferAppFee, 20), 1000); // Min ₦20, Max ₦1000
    ourFee += transferFee;
    console.log(`   - Added transfer fee (1%: ₦20 min, ₦1000 cap): ₦${transferFee}`);
  }

  // Calculate our margin (profit)
  const ourMargin = Number((ourFee - nombaFee).toFixed(2));
  console.log(`   - Our margin (profit): ₦${ourMargin}`);

  return {
    nombaFee: Math.round(nombaFee * 100) / 100,
    ourFee: Math.round(ourFee * 100) / 100,
    ourMargin
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