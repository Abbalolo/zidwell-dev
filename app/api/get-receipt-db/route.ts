// app/api/get-receipts/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED RECEIPTS CACHE
const receiptsCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface ReceiptsQuery {
  userEmail: string;
  limit?: number;
  status?: string;
  page?: number;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

async function getCachedReceipts({ userEmail, limit, status, page = 1, dateFrom, dateTo, type }: ReceiptsQuery) {
  const cacheKey = `receipts_${userEmail.toLowerCase()}_${status || 'all'}_${type || 'all'}_${limit || 'all'}_${page}_${dateFrom || ''}_${dateTo || ''}`;
  const cached = receiptsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached receipts");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh receipts from database");
  
  let query = supabase
    .from('receipts')
    .select('*')
    .eq('initiator_email', userEmail)
    .order('sent_at', { ascending: false });

  // Apply filters if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  // Apply date range filter if provided
  if (dateFrom) {
    query = query.gte('sent_at', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('sent_at', dateTo);
  }

  // Apply pagination if provided
  if (limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data: receipts, error, count } = await query;

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch receipts');
  }

  // Prepare response data
  const responseData = {
    receipts: receipts || [],
    pagination: {
      page,
      limit: limit || receipts?.length || 0,
      total: count || receipts?.length || 0,
      hasMore: limit ? (receipts?.length || 0) === limit : false
    },
    filters: {
      status: status || 'all',
      type: type || 'all',
      dateFrom,
      dateTo
    },
    _fromCache: false
  };

  // Cache the successful response
  receiptsCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });
  
  console.log(`✅ Cached ${receipts?.length || 0} receipts for ${userEmail}`);
  
  return responseData;
}

 function clearReceiptsCache(userEmail: string, filters?: Partial<ReceiptsQuery>) {
  if (filters && (filters.status || filters.type || filters.limit || filters.page || filters.dateFrom || filters.dateTo)) {
    // Clear specific query cache
    const cacheKey = `receipts_${userEmail.toLowerCase()}_${filters.status || 'all'}_${filters.type || 'all'}_${filters.limit || 'all'}_${filters.page || 1}_${filters.dateFrom || ''}_${filters.dateTo || ''}`;
    const existed = receiptsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared specific receipts cache for ${userEmail}`);
    }
    
    return existed;
  } else {
    // Clear all cache for user
    let clearedCount = 0;
    
    for (const [key] of receiptsCache) {
      if (key.startsWith(`receipts_${userEmail.toLowerCase()}`)) {
        receiptsCache.delete(key);
        clearedCount++;
      }
    }
    
    console.log(`🧹 Cleared ${clearedCount} receipts cache entries for ${userEmail}`);
    return clearedCount > 0;
  }
}

 function clearAllReceiptsCache() {
  const count = receiptsCache.size;
  receiptsCache.clear();
  console.log(`🧹 Cleared all receipts cache (${count} entries)`);
}

// Export for use in other files
 async function getReceipts(query: ReceiptsQuery) {
  return await getCachedReceipts(query);
}

export async function POST(req: NextRequest) {
  try {
    const { userEmail, limit, status, type, page = 1, dateFrom, dateTo, nocache } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ 
        success: false,
        message: 'User email is required' 
      }, { status: 400 });
    }

    // Clear cache if force refresh requested
    if (nocache) {
      clearReceiptsCache(userEmail, { status, type, limit, page, dateFrom, dateTo });
    }

    const result = await getCachedReceipts({
      userEmail,
      limit,
      status,
      type,
      page,
      dateFrom,
      dateTo
    });

    return NextResponse.json({
      success: true,
      receipts: result.receipts,
      pagination: result.pagination,
      filters: result.filters,
      _cache: {
        cached: result._fromCache,
        timestamp: Date.now()
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Receipts fetch error:', error.message);
    
    return NextResponse.json({ 
      success: false,
      message: error.message === 'Failed to fetch receipts' 
        ? 'Failed to fetch receipts' 
        : 'Internal server error'
    }, { status: 500 });
  }
}