// app/api/admin-apis/transactions/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED ADMIN TRANSACTIONS CACHE
const adminTransactionsCache = new Map();
const ADMIN_TRANSACTIONS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Statistics cache (separate for better performance)
const transactionsStatsCache = new Map();
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getRangeDates(range: string | null) {
  if (!range || range === "total") return null;

  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setFullYear(start.getFullYear() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      return null;
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

interface AdminTransactionsQuery {
  page: number;
  limit: number;
  range: string;
  search: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  userId?: string;
  includeStats?: boolean;
}

// Cache management functions - NOT EXPORTED
function clearAdminTransactionsCache(filters?: Partial<AdminTransactionsQuery>) {
  if (filters) {
    const cacheKey = `admin_transactions_${filters.page || 1}_${filters.limit || 20}_${filters.range || 'total'}_${filters.search || ''}_${filters.type || ''}_${filters.status || ''}_${filters.startDate || ''}_${filters.endDate || ''}_${filters.userId || 'all'}_${filters.includeStats || false}`;
    const existed = adminTransactionsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared specific admin transactions cache: ${cacheKey}`);
    }
    
    return existed;
  } else {
    const count = adminTransactionsCache.size;
    adminTransactionsCache.clear();
    console.log(`🧹 Cleared all admin transactions cache (${count} entries)`);
    return count;
  }
}

function clearTransactionsStatsCache(range?: string, userId?: string) {
  if (range || userId) {
    const cacheKey = `transactions_stats_${range || 'total'}_${userId || 'all'}`;
    const existed = transactionsStatsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared transactions stats cache for range: ${range}, user: ${userId}`);
    }
    
    return existed;
  } else {
    const count = transactionsStatsCache.size;
    transactionsStatsCache.clear();
    console.log(`🧹 Cleared all transactions stats cache (${count} entries)`);
    return count;
  }
}

function clearAllAdminTransactionsCache() {
  const transactionsCount = clearAdminTransactionsCache();
  const statsCount = clearTransactionsStatsCache();
  
  console.log(`🧹 Cleared all admin transactions cache (${transactionsCount} transactions, ${statsCount} stats)`);
  return { transactionsCount, statsCount };
}

async function getCachedTransactionsStats(range: string = "total", userId?: string) {
  const cacheKey = `transactions_stats_${range}_${userId || 'all'}`;
  const cached = transactionsStatsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < STATS_CACHE_TTL) {
    console.log("✅ Using cached transactions statistics");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh transactions statistics");
  
  const rangeDates = getRangeDates(range);
  
  let statsQuery = supabaseAdmin
    .from("transactions")
    .select("status, type, amount, user_id");

  if (rangeDates) {
    statsQuery = statsQuery
      .gte("created_at", rangeDates.start)
      .lte("created_at", rangeDates.end);
  }

  if (userId) {
    statsQuery = statsQuery.eq("user_id", userId);
  }

  const { data: transactions, error } = await statsQuery;

  if (error) {
    console.error("Error fetching transactions stats:", error);
    return null;
  }

  const stats = {
    total: transactions?.length || 0,
    successful: transactions?.filter(t => t.status === "success").length || 0,
    failed: transactions?.filter(t => t.status === "failed").length || 0,
    pending: transactions?.filter(t => t.status === "pending").length || 0,
    totalAmount: transactions
      ?.filter(t => t.status === "success")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0,
    byType: transactions?.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };

  transactionsStatsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now()
  });

  return stats;
}

async function getCachedAdminTransactions({
  page,
  limit,
  range,
  search,
  type,
  status,
  startDate,
  endDate,
  userId,
  includeStats = false
}: AdminTransactionsQuery) {
  const cacheKey = `admin_transactions_${page}_${limit}_${range}_${search}_${type}_${status}_${startDate}_${endDate}_${userId || 'all'}_${includeStats}`;
  const cached = adminTransactionsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < ADMIN_TRANSACTIONS_CACHE_TTL) {
    console.log("✅ Using cached admin transactions data");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh admin transactions data from database");
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build the query
  let query = supabaseAdmin
    .from("transactions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply user filter first (if specific user)
  if (userId) {
    query = query.eq("user_id", userId);
  }

  // Apply search filter - enhanced to search across multiple fields including user data
  if (search && !userId) {
    query = query.or(`
      reference.ilike.%${search}%,
      user_id.ilike.%${search}%,
      description.ilike.%${search}%,
      phone_number.ilike.%${search}%,
      user_email.ilike.%${search}%,
      user_name.ilike.%${search}%
    `);
  }

  // Apply type filter
  if (type && type !== 'all') {
    query = query.eq("type", type);
  }

  // Apply status filter
  if (status && status !== 'all') {
    query = query.eq("status", status);
  }

  // Apply date range filter (priority: custom dates > predefined range)
  if (startDate && endDate) {
    // Custom date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
  } else {
    // Predefined range
    const rangeDates = getRangeDates(range);
    if (rangeDates) {
      query = query.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
    }
  }

  // Get total count for pagination
  const { data: countData, error: countError, count } = await query;
  const totalCount = count || 0;

  if (countError) {
    throw new Error(`Count error: ${countError.message}`);
  }

  // Apply pagination
  query = query.range(from, to);

  const { data: transactions, error } = await query;

  if (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }

  // Get statistics if requested
  let stats = null;
  if (includeStats) {
    stats = await getCachedTransactionsStats(range, userId);
  }

  const responseData = {
    page,
    limit,
    total: totalCount,
    range,
    transactions: transactions ?? [],
    filters: {
      search,
      type,
      status,
      startDate,
      endDate,
      userId
    },
    stats,
    _fromCache: false
  };

  // Cache the successful response
  adminTransactionsCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  console.log(`✅ Cached ${transactions?.length || 0} admin transactions for page ${page}`);
  
  return responseData;
}

// Only export HTTP methods
export async function GET(req: Request) {
  try {
    // Admin authentication using the utility file
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const range = url.searchParams.get("range") ?? "total";
    const search = url.searchParams.get("search") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";
    const userId = url.searchParams.get("userId") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    // Clear cache if force refresh requested
    if (nocache) {
      clearAdminTransactionsCache({
        page, limit, range, search, type, status, startDate, endDate, userId, includeStats
      });
      if (includeStats) {
        clearTransactionsStatsCache(range, userId);
      }
      console.log(`🔄 Force refreshing admin transactions data`);
    }

    const result = await getCachedAdminTransactions({
      page,
      limit,
      range,
      search,
      type,
      status,
      startDate,
      endDate,
      userId: userId || undefined,
      includeStats
    });

    const { _fromCache, ...cleanResponse } = result;

    return NextResponse.json({
      ...cleanResponse,
      _cache: {
        cached: _fromCache,
        timestamp: Date.now(),
        page,
        limit,
        range,
        filters: {
          search,
          type,
          status,
          startDate,
          endDate,
          userId
        },
        includeStats
      },
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("Server error (transactions route):", err);
    
    return NextResponse.json({ 
      error: err?.message?.includes('Fetch error') 
        ? 'Failed to fetch transactions' 
        : err?.message?.includes('Count error')
        ? 'Failed to count transactions'
        : 'Server error'
    }, { status: 500 });
  }
}