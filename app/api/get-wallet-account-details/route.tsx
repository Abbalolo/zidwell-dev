import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED USER WALLET/BANK DETAILS CACHE
const userWalletCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UserWalletData {
  wallet_id: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  p_bank_name: string | null;
  p_bank_code: string | null;
  p_account_name: string | null;
  p_account_number: string | null;
}

async function getCachedUserWallet(userId: string): Promise<UserWalletData & { _fromCache: boolean }> {
  const cacheKey = `user_wallet_${userId}`;
  const cached = userWalletCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached user wallet details");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh user wallet details from database");
  
  const { data, error } = await supabase
    .from("users")
    .select("wallet_id, bank_name, bank_account_name, bank_account_number, p_account_name, p_account_number, p_bank_name, p_bank_code")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ Database error:", error);
    throw new Error("User not found");
  }

  if (!data) {
    throw new Error("User not found");
  }

  // Prepare response data with proper typing
  const responseData: UserWalletData = {
    wallet_id: data.wallet_id,
    bank_name: data.bank_name,
    bank_account_name: data.bank_account_name,
    bank_account_number: data.bank_account_number,
    p_bank_name: data.p_bank_name,
    p_bank_code: data.p_bank_code,
    p_account_name: data.p_account_name,
    p_account_number: data.p_account_number,
  };

  // Cache the successful response
  userWalletCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });
  
  return {
    ...responseData,
    _fromCache: false
  };
}

 function clearUserWalletCache(userId: string) {
  const cacheKey = `user_wallet_${userId}`;
  const existed = userWalletCache.delete(cacheKey);
  
  if (existed) {
    console.log(`🧹 Cleared user wallet cache for user ${userId}`);
  }
  
  return existed;
}

 function clearAllUserWalletCache() {
  const count = userWalletCache.size;
  userWalletCache.clear();
  console.log(`🧹 Cleared all user wallet cache (${count} entries)`);
}

// Export for use in other files
 async function getUserWalletDetails(userId: string): Promise<UserWalletData> {
  const data = await getCachedUserWallet(userId);
  // Remove the cache flag before returning
  const { _fromCache, ...walletData } = data;
  return walletData;
}

export async function POST(req: Request) {
  try {
    const { userId, nocache } = await req.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: "userId is required" 
      }, { status: 400 });
    }

    // Clear cache if force refresh requested
    if (nocache) {
      clearUserWalletCache(userId);
    }

    const data = await getCachedUserWallet(userId);

    // Remove cache flag from response
    const { _fromCache, ...walletData } = data;

    return NextResponse.json({
      success: true,
      data: walletData,
      bank_details: {
        bank_name: data.bank_name,
        bank_account_name: data.bank_account_name,
        bank_account_number: data.bank_account_number
      },
      payment_details: {
        p_bank_name: data.p_bank_name,
        p_bank_code: data.p_bank_code,
        p_account_name: data.p_account_name,
        p_account_number: data.p_account_number
      },
      wallet: {
        wallet_id: data.wallet_id
      },
      _cache: {
        cached: data._fromCache,
        timestamp: Date.now()
      }
    });
  } catch (err: any) {
    console.error("❌ User wallet details error:", err.message);
    
    if (err.message === "User not found") {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}