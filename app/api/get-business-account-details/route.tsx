import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ENHANCED BUSINESS DATA CACHE
const businessDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedBusinessData(userId: string) {
  const cacheKey = `business_${userId}`;
  const cached = businessDataCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached business data");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh business data from database");
  
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "business_name, business_category, registration_number, tax_id, business_address, business_description, bank_name, bank_account_number, bank_account_name, bank_code, updated_at"
    )
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("❌ Database error:", error);
    throw new Error("Business not found");
  }

  if (!data) {
    throw new Error("Business not found");
  }

  // Prepare response data
  const responseData = {
    business_name: data.business_name,
    business_category: data.business_category,
    registration_number: data.registration_number,
    tax_id: data.tax_id,
    business_address: data.business_address,
    business_description: data.business_description,
    bank_name: data.bank_name,
    bank_account_number: data.bank_account_number,
    bank_account_name: data.bank_account_name,
    bank_code: data.bank_code,
    updated_at: data.updated_at,
    _fromCache: false
  };

  // Cache the successful response
  businessDataCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });
  
  return responseData;
}

 function clearBusinessDataCache(userId: string) {
  const cacheKey = `business_${userId}`;
  const existed = businessDataCache.delete(cacheKey);
  
  if (existed) {
    console.log(`🧹 Cleared business data cache for user ${userId}`);
  }
  
  return existed;
}

 function clearAllBusinessCache() {
  const count = businessDataCache.size;
  businessDataCache.clear();
  console.log(`🧹 Cleared all business cache (${count} entries)`);
}

// Export for use in other files
 async function getBusinessData(userId: string) {
  return await getCachedBusinessData(userId);
}

export async function POST(req: Request) {
  try {
    const { userId, nocache } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Clear cache if force refresh requested
    if (nocache) {
      clearBusinessDataCache(userId);
    }

    const data = await getCachedBusinessData(userId);

    return NextResponse.json({
      success: true,
      data: {
        business_name: data.business_name,
        business_category: data.business_category,
        registration_number: data.registration_number,
        tax_id: data.tax_id,
        business_address: data.business_address,
        business_description: data.business_description,
        bank_name: data.bank_name,
        bank_account_number: data.bank_account_number,
        bank_account_name: data.bank_account_name,
        bank_code: data.bank_code,
        updated_at: data.updated_at
      },
      bank_details: {
        bank_code: data.bank_code,
        bank_name: data.bank_name,
        bank_account_name: data.bank_account_name,
        bank_account_number: data.bank_account_number
      },
      _cache: {
        cached: data._fromCache,
        timestamp: Date.now()
      }
    });
  } catch (err: any) {
    console.error("❌ Business data error:", err.message);
    
    if (err.message === "Business not found") {
      return NextResponse.json({ 
        success: false,
        error: "Business not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}