// app/api/admin-apis/receipts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED ADMIN RECEIPTS CACHE
const adminReceiptsCache = new Map();
const ADMIN_RECEIPTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Statistics cache (separate for better performance)
const receiptsStatsCache = new Map();
const STATS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

interface AdminReceiptsQuery {
  page: number;
  limit: number;
  range: string;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  includeStats?: boolean;
}

// Cache management functions - NOT EXPORTED
function clearAdminReceiptsCache(filters?: Partial<AdminReceiptsQuery>) {
  if (filters) {
    const cacheKey = `admin_receipts_${filters.page || 1}_${filters.limit || 10}_${filters.range || 'total'}_${filters.search || ''}_${filters.status || ''}_${filters.startDate || ''}_${filters.endDate || ''}_${filters.includeStats || false}`;
    const existed = adminReceiptsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared specific admin receipts cache: ${cacheKey}`);
    }
    
    return existed;
  } else {
    const count = adminReceiptsCache.size;
    adminReceiptsCache.clear();
    console.log(`🧹 Cleared all admin receipts cache (${count} entries)`);
    return count;
  }
}

function clearReceiptsStatsCache(range?: string) {
  if (range) {
    const cacheKey = `receipts_stats_${range}`;
    const existed = receiptsStatsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared receipts stats cache for range: ${range}`);
    }
    
    return existed;
  } else {
    const count = receiptsStatsCache.size;
    receiptsStatsCache.clear();
    console.log(`🧹 Cleared all receipts stats cache (${count} entries)`);
    return count;
  }
}

function clearAllAdminReceiptsCache() {
  const receiptsCount = clearAdminReceiptsCache();
  const statsCount = clearReceiptsStatsCache();
  
  console.log(`🧹 Cleared all admin receipts cache (${receiptsCount} receipts, ${statsCount} stats)`);
  return { receiptsCount, statsCount };
}

async function getCachedReceiptsStats(range: string = "total") {
  const cacheKey = `receipts_stats_${range}`;
  const cached = receiptsStatsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < STATS_CACHE_TTL) {
    console.log("✅ Using cached receipts statistics");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh receipts statistics");
  
  const rangeDates = getRangeDates(range);
  
  let statsQuery = supabaseAdmin
    .from("receipts")
    .select("status, total_amount, created_at");

  if (rangeDates) {
    statsQuery = statsQuery
      .gte("created_at", rangeDates.start)
      .lte("created_at", rangeDates.end);
  }

  const { data: receipts, error } = await statsQuery;

  if (error) {
    console.error("Error fetching receipts stats:", error);
    return null;
  }

  const stats = {
    total: receipts?.length || 0,
    draft: receipts?.filter(f => f.status === "draft").length || 0,
    sent: receipts?.filter(f => f.status === "sent").length || 0,
    paid: receipts?.filter(f => f.status === "paid").length || 0,
    overdue: receipts?.filter(f => f.status === "overdue").length || 0,
    cancelled: receipts?.filter(f => f.status === "cancelled").length || 0,
    totalRevenue: receipts?.filter(f => f.status === "paid").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    pendingRevenue: receipts?.filter(f => f.status === "sent").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    byMonth: receipts?.reduce((acc, f) => {
      const date = new Date(f.created_at);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };

  receiptsStatsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now()
  });

  return stats;
}

async function getCachedAdminReceipts({
  page,
  limit,
  range,
  search,
  status,
  startDate,
  endDate,
  includeStats = false
}: AdminReceiptsQuery) {
  const cacheKey = `admin_receipts_${page}_${limit}_${range}_${search}_${status}_${startDate}_${endDate}_${includeStats}`;
  const cached = adminReceiptsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < ADMIN_RECEIPTS_CACHE_TTL) {
    console.log("✅ Using cached admin receipts data");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh admin receipts data from database");
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build the query
  let query = supabaseAdmin
    .from("receipts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply search filter
  if (search) {
    query = query.or(`receipt_id.ilike.%${search}%,initiator_email.ilike.%${search}%,signee_email.ilike.%${search}%`);
  }

  // Apply status filter
  if (status) {
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

  const { data: receipts, error } = await query;

  if (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }

  // Get statistics if requested
  let stats = null;
  if (includeStats) {
    stats = await getCachedReceiptsStats(range);
  }

  const responseData = {
    page,
    limit,
    total: totalCount,
    range,
    receipts: receipts ?? [],
    filters: {
      search,
      status,
      startDate,
      endDate
    },
    stats,
    _fromCache: false
  };

  // Cache the successful response
  adminReceiptsCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  console.log(`✅ Cached ${receipts?.length || 0} admin receipts for page ${page}`);
  
  return responseData;
}

// Only export HTTP methods
// 📄 GET: List receipts with filters and pagination
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const range = url.searchParams.get("range") ?? "total";
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    // Clear cache if force refresh requested
    if (nocache) {
      clearAdminReceiptsCache({
        page, limit, range, search, status, startDate, endDate, includeStats
      });
      if (includeStats) {
        clearReceiptsStatsCache(range);
      }
      console.log(`🔄 Force refreshing admin receipts data`);
    }

    const result = await getCachedAdminReceipts({
      page,
      limit,
      range,
      search,
      status,
      startDate,
      endDate,
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
          status,
          startDate,
          endDate
        },
        includeStats
      }
    });
  } catch (err: any) {
    console.error("Server error (receipts route):", err);
    
    return NextResponse.json({ 
      error: err?.message?.includes('Fetch error') 
        ? 'Failed to fetch receipts' 
        : err?.message?.includes('Count error')
        ? 'Failed to count receipts'
        : 'Server error'
    }, { status: 500 });
  }
}

// 🔄 PATCH: Update receipt status
export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Both 'id' and 'status' are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("receipts")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🧹 CLEAR CACHE AFTER STATUS UPDATE
    console.log("🧹 Clearing cache after receipt status update...");
    clearAllAdminReceiptsCache();

    return NextResponse.json({ 
      message: "Receipt updated", 
      data,
      cacheCleared: true
    });
  } catch (err: any) {
    console.error("Server error (receipts PATCH):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// 🗑️ DELETE: Remove a receipt
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "'id' is required to delete a receipt." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("receipts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🧹 CLEAR CACHE AFTER DELETION
    console.log("🧹 Clearing cache after receipt deletion...");
    clearAllAdminReceiptsCache();

    return NextResponse.json({ 
      message: "Receipt deleted successfully",
      cacheCleared: true
    });
  } catch (err: any) {
    console.error("Server error (receipts DELETE):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}