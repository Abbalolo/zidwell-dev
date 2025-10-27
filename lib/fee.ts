// lib/fees.ts
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
    // Checkout: Nomba charges 1.4% + ₦1800, we charge 1.6% capped at ₦20,000
    const nombaPercentage = am * 0.014; // 1.4%
    nombaFee = nombaPercentage + 1800; // + ₦1800 flat fee
    
    const appPercentage = am * 0.016; // 1.6%
    appFee = Math.min(appPercentage, 20000); // Cap at ₦20,000
  } 
  else if (paymentMethod === "virtual_account") {
    // Virtual Account: Nomba charges 0.5% (₦10 min, ₦100 cap), we charge 0.5% (₦10 min, ₦2000 cap)
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 10), 100); // Min ₦10, Max ₦100
    
    const appPercentage = am * 0.005; // 0.5%
    appFee = Math.min(Math.max(appPercentage, 10), 2000); // Min ₦10, Max ₦2000
  } 
  else if (paymentMethod === "bank_transfer") {
    // Pay by Transfer: Nomba charges 0.5% (₦20 min, ₦100 cap), we charge 0.5% (₦20 min, ₦2000 cap)
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 20), 100); // Min ₦20, Max ₦100
    
    const appPercentage = am * 0.005; // 0.5%
    appFee = Math.min(Math.max(appPercentage, 20), 2000); // Min ₦20, Max ₦2000
  }

  // For transfers, add additional app fee
  if (type === "transfer") {
    const transferAppFee = am * 0.005; // 0.5% additional app fee for transfers
    appFee += Math.min(transferAppFee, 2000); // Cap at ₦2000
  }

  const totalFee = appFee; // We charge the customer our app fee
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
    // Checkout: Nomba charges 1.4% + ₦1800, we charge 1.6% capped at ₦20,000
    const nombaPercentage = amount * 0.014; // 1.4%
    nombaFee = nombaPercentage + 1800; // + ₦1800 flat fee
    
    const ourPercentage = amount * 0.016; // 1.6%
    ourFee = Math.min(ourPercentage, 20000); // Cap at ₦20,000
    console.log(`   - Nomba Checkout fee (1.4% + ₦1800): ₦${nombaFee}`);
    console.log(`   - Our Checkout fee (1.6% capped at ₦20,000): ₦${ourFee}`);
  } 
  else if (channel === "virtual_account" || txType === "virtual_account_deposit") {
    // Virtual Account: Nomba charges 0.5% (₦10 min, ₦100 cap), we charge 0.5% (₦10 min, ₦2000 cap)
    const nombaPercentage = amount * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 10), 100); // Min ₦10, Max ₦100
    
    const ourPercentage = amount * 0.005; // 0.5%
    ourFee = Math.min(Math.max(ourPercentage, 10), 2000); // Min ₦10, Max ₦2000
    console.log(`   - Nomba VA fee (0.5%: ₦10 min, ₦100 cap): ₦${nombaFee}`);
    console.log(`   - Our VA fee (0.5%: ₦10 min, ₦2000 cap): ₦${ourFee}`);
  } 
  else if (channel === "bank_transfer" || txType === "transfer_deposit") {
    // Pay by Transfer: Nomba charges 0.5% (₦20 min, ₦100 cap), we charge 0.5% (₦20 min, ₦2000 cap)
    const nombaPercentage = amount * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 20), 100); // Min ₦20, Max ₦100
    
    const ourPercentage = amount * 0.005; // 0.5%
    ourFee = Math.min(Math.max(ourPercentage, 20), 2000); // Min ₦20, Max ₦2000
    console.log(`   - Nomba Transfer fee (0.5%: ₦20 min, ₦100 cap): ₦${nombaFee}`);
    console.log(`   - Our Transfer fee (0.5%: ₦20 min, ₦2000 cap): ₦${ourFee}`);
  } 
  else {
    // Default fallback
    console.log(`   - Unknown channel, using zero fees`);
    nombaFee = 0;
    ourFee = 0;
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