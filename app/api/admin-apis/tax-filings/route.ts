// app/api/admin-apis/tax-filings/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED ADMIN TAX FILINGS CACHE
const adminTaxFilingsCache = new Map();
const ADMIN_TAX_FILINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Statistics cache (separate for better performance)
const taxFilingsStatsCache = new Map();
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

interface AdminTaxFilingsQuery {
  page: number;
  limit: number;
  range: string;
  search: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
  includeStats?: boolean;
}

// Cache management functions - NOT EXPORTED
function clearAdminTaxFilingsCache(filters?: Partial<AdminTaxFilingsQuery>) {
  if (filters) {
    const cacheKey = `admin_tax_filings_${filters.page || 1}_${filters.limit || 10}_${filters.range || 'total'}_${filters.search || ''}_${filters.status || ''}_${filters.type || ''}_${filters.startDate || ''}_${filters.endDate || ''}_${filters.includeStats || false}`;
    const existed = adminTaxFilingsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared specific admin tax filings cache: ${cacheKey}`);
    }
    
    return existed;
  } else {
    const count = adminTaxFilingsCache.size;
    adminTaxFilingsCache.clear();
    console.log(`🧹 Cleared all admin tax filings cache (${count} entries)`);
    return count;
  }
}

function clearTaxFilingsStatsCache(range?: string) {
  if (range) {
    const cacheKey = `tax_filings_stats_${range}`;
    const existed = taxFilingsStatsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared tax filings stats cache for range: ${range}`);
    }
    
    return existed;
  } else {
    const count = taxFilingsStatsCache.size;
    taxFilingsStatsCache.clear();
    console.log(`🧹 Cleared all tax filings stats cache (${count} entries)`);
    return count;
  }
}

function clearAllAdminTaxFilingsCache() {
  const filingsCount = clearAdminTaxFilingsCache();
  const statsCount = clearTaxFilingsStatsCache();
  
  console.log(`🧹 Cleared all admin tax filings cache (${filingsCount} filings, ${statsCount} stats)`);
  return { filingsCount, statsCount };
}

async function getCachedTaxFilingsStats(range: string = "total") {
  const cacheKey = `tax_filings_stats_${range}`;
  const cached = taxFilingsStatsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < STATS_CACHE_TTL) {
    console.log("✅ Using cached tax filings statistics");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh tax filings statistics");
  
  const rangeDates = getRangeDates(range);
  
  let statsQuery = supabaseAdmin
    .from("tax_filings")
    .select("status, filing_type, created_at");

  if (rangeDates) {
    statsQuery = statsQuery
      .gte("created_at", rangeDates.start)
      .lte("created_at", rangeDates.end);
  }

  const { data: filings, error } = await statsQuery;

  if (error) {
    console.error("Error fetching tax filings stats:", error);
    return null;
  }

  const stats = {
    total: filings?.length || 0,
    pending: filings?.filter(f => f.status === "pending").length || 0,
    submitted: filings?.filter(f => f.status === "submitted").length || 0,
    approved: filings?.filter(f => f.status === "approved").length || 0,
    rejected: filings?.filter(f => f.status === "rejected").length || 0,
    byType: filings?.reduce((acc, f) => {
      acc[f.filing_type] = (acc[f.filing_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    byMonth: filings?.reduce((acc, f) => {
      const date = new Date(f.created_at);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };

  taxFilingsStatsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now()
  });

  return stats;
}

async function getCachedAdminTaxFilings({
  page,
  limit,
  range,
  search,
  status,
  type,
  startDate,
  endDate,
  includeStats = false
}: AdminTaxFilingsQuery) {
  const cacheKey = `admin_tax_filings_${page}_${limit}_${range}_${search}_${status}_${type}_${startDate}_${endDate}_${includeStats}`;
  const cached = adminTaxFilingsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < ADMIN_TAX_FILINGS_CACHE_TTL) {
    console.log("✅ Using cached admin tax filings data");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh admin tax filings data from database");
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build the query
  let query = supabaseAdmin
    .from("tax_filings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply search filter
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,nin.ilike.%${search}%`);
  }

  // Apply status filter
  if (status) {
    query = query.eq("status", status);
  }

  // Apply type filter
  if (type) {
    query = query.eq("filing_type", type);
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

  const { data: filings, error } = await query;

  if (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }

  // Get statistics if requested
  let stats = null;
  if (includeStats) {
    stats = await getCachedTaxFilingsStats(range);
  }

  const responseData = {
    page,
    limit,
    total: totalCount,
    range,
    filings: filings ?? [],
    filters: {
      search,
      status,
      type,
      startDate,
      endDate
    },
    stats,
    _fromCache: false
  };

  // Cache the successful response
  adminTaxFilingsCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  console.log(`✅ Cached ${filings?.length || 0} admin tax filings for page ${page}`);
  
  return responseData;
}

// Only export HTTP methods
// 📄 GET: List tax filings with filters and pagination
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const range = url.searchParams.get("range") ?? "total";
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    // Clear cache if force refresh requested
    if (nocache) {
      clearAdminTaxFilingsCache({
        page, limit, range, search, status, type, startDate, endDate, includeStats
      });
      if (includeStats) {
        clearTaxFilingsStatsCache(range);
      }
      console.log(`🔄 Force refreshing admin tax filings data`);
    }

    const result = await getCachedAdminTaxFilings({
      page,
      limit,
      range,
      search,
      status,
      type,
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
          type,
          startDate,
          endDate
        },
        includeStats
      }
    });
  } catch (err: any) {
    console.error("Server error (tax-filings route):", err);
    
    return NextResponse.json({ 
      error: err?.message?.includes('Fetch error') 
        ? 'Failed to fetch tax filings' 
        : err?.message?.includes('Count error')
        ? 'Failed to count tax filings'
        : 'Server error'
    }, { status: 500 });
  }
}

// 🔄 PATCH: Bulk update filing status
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
      .from("tax_filings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🧹 CLEAR CACHE AFTER STATUS UPDATE
    console.log("🧹 Clearing cache after tax filing status update...");
    clearAllAdminTaxFilingsCache();

    return NextResponse.json({ 
      message: "Tax filing status updated", 
      data,
      cacheCleared: true
    });
  } catch (err: any) {
    console.error("Server error (tax-filings PATCH):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// 🗑️ DELETE: Remove a filing
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "'id' is required to delete a filing." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("tax_filings")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🧹 CLEAR CACHE AFTER DELETION
    console.log("🧹 Clearing cache after tax filing deletion...");
    clearAllAdminTaxFilingsCache();

    return NextResponse.json({ 
      message: "Tax filing deleted successfully",
      cacheCleared: true
    });
  } catch (err: any) {
    console.error("Server error (tax-filings DELETE):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}