// /api/bill-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED TRANSACTIONS CACHE
const transactionsCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

async function getCachedTransactions(userId: string, search: string = "") {
  const cacheKey = `transactions_${userId}_${search.toLowerCase()}`;
  const cached = transactionsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached transactions");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh transactions from database");
  
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (search) {
    query = query.ilike("type", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Cache the results
  if (data) {
    transactionsCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    // Log cache stats occasionally
    if (Math.random() < 0.1) { // 10% chance
      console.log(`📊 Transactions cache size: ${transactionsCache.size}`);
    }
  }
  
  return data;
}

// Move cache clearing function to a separate utility file or make it internal
function clearTransactionsCache(userId: string) {
  const keysToDelete = [];
  for (const [key] of transactionsCache) {
    if (key.startsWith(`transactions_${userId}`)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => transactionsCache.delete(key));
  console.log(`🧹 Cleared ${keysToDelete.length} transaction cache entries for user ${userId}`);
}

// Optional: Periodic cache cleanup
function cleanupExpiredCache() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of transactionsCache) {
    if (now - value.timestamp > CACHE_TTL) {
      transactionsCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search") || "";
    const nocache = searchParams.get("nocache"); // Optional: force refresh

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    let data;
    
    if (nocache === "true") {
      // Force refresh by deleting cache first
      const cacheKey = `transactions_${userId}_${search.toLowerCase()}`;
      transactionsCache.delete(cacheKey);
      console.log("🔄 Force refreshing transactions (nocache=true)");
    }
    
    data = await getCachedTransactions(userId, search);

    return NextResponse.json({ 
      transactions: data,
      cached: !nocache // Indicate if response was cached
    });
  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}