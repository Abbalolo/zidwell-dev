// /app/api/get-contracts/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// ENHANCED CONTRACTS CACHE
const contractsCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface ContractsQuery {
  userEmail: string;
  limit?: number;
  status?: string;
  page?: number;
}

async function getCachedContracts({ userEmail, limit, status, page = 1 }: ContractsQuery) {
  const cacheKey = `contracts_${userEmail.toLowerCase()}_${status || 'all'}_${limit || 'all'}_${page}`;
  const cached = contractsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached contracts");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh contracts from database");
  
  let query = supabase
    .from('contracts')
    .select('*')
    .eq('initiator_email', userEmail)
    .order('created_at', { ascending: false });

  // Apply filters if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Apply pagination if provided
  if (limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch contracts');
  }

  // Prepare response data
  const responseData = {
    contracts: data || [],
    pagination: {
      page,
      limit: limit || data?.length || 0,
      total: count || data?.length || 0,
      hasMore: limit ? (data?.length || 0) === limit : false
    },
    _fromCache: false
  };

  // Cache the successful response
  contractsCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });
  
  console.log(`✅ Cached ${data?.length || 0} contracts for ${userEmail}`);
  
  return responseData;
}

 function clearContractsCache(userEmail: string, status?: string, limit?: number, page?: number) {
  if (status || limit || page) {
    // Clear specific query cache
    const cacheKey = `contracts_${userEmail.toLowerCase()}_${status || 'all'}_${limit || 'all'}_${page || 1}`;
    const existed = contractsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared specific contracts cache for ${userEmail}`);
    }
    
    return existed;
  } else {
    // Clear all cache for user
    let clearedCount = 0;
    
    for (const [key] of contractsCache) {
      if (key.startsWith(`contracts_${userEmail.toLowerCase()}`)) {
        contractsCache.delete(key);
        clearedCount++;
      }
    }
    
    console.log(`🧹 Cleared ${clearedCount} contracts cache entries for ${userEmail}`);
    return clearedCount > 0;
  }
}

 function clearAllContractsCache() {
  const count = contractsCache.size;
  contractsCache.clear();
  console.log(`🧹 Cleared all contracts cache (${count} entries)`);
}

// Export for use in other files
 async function getContracts(query: ContractsQuery) {
  return await getCachedContracts(query);
}

export async function POST(req: Request) {
  try {
    const { userEmail, limit, status, page = 1, nocache } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ 
        success: false,
        message: 'User email is required' 
      }, { status: 400 });
    }

    // Clear cache if force refresh requested
    if (nocache) {
      clearContractsCache(userEmail, status, limit, page);
    }

    const result = await getCachedContracts({
      userEmail,
      limit,
      status,
      page
    });

    return NextResponse.json({
      success: true,
      contracts: result.contracts,
      pagination: result.pagination,
      _cache: {
        cached: result._fromCache,
        timestamp: Date.now()
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching contracts:', error.message);
    
    return NextResponse.json({ 
      success: false,
      message: error.message === 'Failed to fetch contracts' 
        ? 'Failed to fetch contracts' 
        : 'Internal server error'
    }, { status: 500 });
  }
}