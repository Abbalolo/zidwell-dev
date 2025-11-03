// app/api/get-invoices-db/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED INVOICES CACHE
const invoicesCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface InvoicesQuery {
  userEmail: string;
  limit?: number;
  status?: string;
  page?: number;
  dateFrom?: string;
  dateTo?: string;
}

async function getCachedInvoices({ userEmail, limit, status, page = 1, dateFrom, dateTo }: InvoicesQuery) {
  const cacheKey = `invoices_${userEmail.toLowerCase()}_${status || 'all'}_${limit || 'all'}_${page}_${dateFrom || ''}_${dateTo || ''}`;
  const cached = invoicesCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached invoices");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh invoices from database");
  
  let query = supabase
    .from('invoices')
    .select('*')
    .eq('initiator_email', userEmail)
    .order('created_at', { ascending: false });

  // Apply filters if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Apply date range filter if provided
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  // Apply pagination if provided
  if (limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data: invoices, error, count } = await query;

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch invoices');
  }

  // Prepare response data
  const responseData = {
    invoices: invoices || [],
    pagination: {
      page,
      limit: limit || invoices?.length || 0,
      total: count || invoices?.length || 0,
      hasMore: limit ? (invoices?.length || 0) === limit : false
    },
    filters: {
      status: status || 'all',
      dateFrom,
      dateTo
    },
    _fromCache: false
  };

  // Cache the successful response
  invoicesCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });
  
  console.log(`✅ Cached ${invoices?.length || 0} invoices for ${userEmail}`);
  
  return responseData;
}

 function clearInvoicesCache(userEmail: string, filters?: Partial<InvoicesQuery>) {
  if (filters && (filters.status || filters.limit || filters.page || filters.dateFrom || filters.dateTo)) {
    // Clear specific query cache
    const cacheKey = `invoices_${userEmail.toLowerCase()}_${filters.status || 'all'}_${filters.limit || 'all'}_${filters.page || 1}_${filters.dateFrom || ''}_${filters.dateTo || ''}`;
    const existed = invoicesCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared specific invoices cache for ${userEmail}`);
    }
    
    return existed;
  } else {
    // Clear all cache for user
    let clearedCount = 0;
    
    for (const [key] of invoicesCache) {
      if (key.startsWith(`invoices_${userEmail.toLowerCase()}`)) {
        invoicesCache.delete(key);
        clearedCount++;
      }
    }
    
    console.log(`🧹 Cleared ${clearedCount} invoices cache entries for ${userEmail}`);
    return clearedCount > 0;
  }
}

 function clearAllInvoicesCache() {
  const count = invoicesCache.size;
  invoicesCache.clear();
  console.log(`🧹 Cleared all invoices cache (${count} entries)`);
}

// Export for use in other files
 async function getInvoices(query: InvoicesQuery) {
  return await getCachedInvoices(query);
}

export async function POST(req: NextRequest) {
  try {
    const { userEmail, limit, status, page = 1, dateFrom, dateTo, nocache } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ 
        success: false,
        message: 'User email is required' 
      }, { status: 400 });
    }

    // Clear cache if force refresh requested
    if (nocache) {
      clearInvoicesCache(userEmail, { status, limit, page, dateFrom, dateTo });
    }

    const result = await getCachedInvoices({
      userEmail,
      limit,
      status,
      page,
      dateFrom,
      dateTo
    });

    return NextResponse.json({
      success: true,
      invoices: result.invoices,
      pagination: result.pagination,
      filters: result.filters,
      _cache: {
        cached: result._fromCache,
        timestamp: Date.now()
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Invoices fetch error:', error.message);
    
    return NextResponse.json({ 
      success: false,
      message: error.message === 'Failed to fetch invoices' 
        ? 'Failed to fetch invoices' 
        : 'Internal server error'
    }, { status: 500 });
  }
}