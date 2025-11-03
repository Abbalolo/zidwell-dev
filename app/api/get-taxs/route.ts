import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ADD TAX FILINGS CACHE
const taxFilingsCache = new Map();

async function getCachedTaxFilings(userId: string) {
  const cacheKey = `tax_filings_${userId}`;
  const cached = taxFilingsCache.get(cacheKey);
  
  // Cache for 5 minutes - tax filings don't change often
  if (cached && (Date.now() - cached.timestamp) < (5 * 60 * 1000)) {
    console.log("✅ Using cached tax filings");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh tax filings from database");
  
  const { data: taxFilings, error } = await supabase
    .from('tax_filings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch tax filings');
  }

  // Cache the successful response
  if (taxFilings) {
    taxFilingsCache.set(cacheKey, {
      data: taxFilings,
      timestamp: Date.now()
    });
    
    console.log(`✅ Cached ${taxFilings.length} tax filings for user ${userId}`);
  }
  
  return taxFilings;
}

// Function to clear tax filings cache (call when new filings are submitted)
 function clearTaxFilingsCache(userId: string) {
  const cacheKey = `tax_filings_${userId}`;
  const existed = taxFilingsCache.delete(cacheKey);
  
  if (existed) {
    console.log(`🧹 Cleared tax filings cache for user ${userId}`);
  }
  
  return existed;
}

// Function to clear all tax filings cache (admin function)
 function clearAllTaxFilingsCache() {
  const count = taxFilingsCache.size;
  taxFilingsCache.clear();
  console.log(`🧹 Cleared all tax filings cache (${count} entries)`);
}

// Clear cache for multiple users
 function clearTaxFilingsCacheForUsers(userIds: string[]) {
  let clearedCount = 0;
  
  userIds.forEach(userId => {
    const cacheKey = `tax_filings_${userId}`;
    if (taxFilingsCache.delete(cacheKey)) {
      clearedCount++;
    }
  });
  
  console.log(`🧹 Cleared tax filings cache for ${clearedCount} users`);
}

// Optional: Periodic cache cleanup
function cleanupExpiredTaxFilingsCache() {
  const now = Date.now();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  let cleanedCount = 0;
  
  for (const [key, value] of taxFilingsCache) {
    if (now - value.timestamp > CACHE_TTL) {
      taxFilingsCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired tax filings cache entries`);
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredTaxFilingsCache, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const { userId, nocache } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'User id is missing' }, { status: 400 });
    }

    // Clear cache if force refresh requested
    if (nocache) {
      clearTaxFilingsCache(userId);
    }

    // USE CACHED TAX FILINGS
    const taxFilings = await getCachedTaxFilings(userId);

    return NextResponse.json({ 
      receipts: taxFilings, // Keeping original response structure
      _cache: {
        cached: taxFilingsCache.has(`tax_filings_${userId}`),
        timestamp: Date.now(),
        count: taxFilings.length
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Tax filings fetch error:', error.message);
    
    if (error.message === 'Failed to fetch tax filings') {
      return NextResponse.json({ message: 'Failed to fetch tax filings' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}