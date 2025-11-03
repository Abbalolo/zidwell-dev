// app/api/admin-apis/invoices/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED ADMIN INVOICES CACHE
const adminInvoicesCache = new Map();
const ADMIN_INVOICES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Statistics cache (separate for better performance)
const invoicesStatsCache = new Map();
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

interface AdminInvoicesQuery {
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
function clearAdminInvoicesCache(filters?: Partial<AdminInvoicesQuery>) {
  if (filters) {
    const cacheKey = `admin_invoices_${filters.page || 1}_${filters.limit || 10}_${filters.range || 'total'}_${filters.search || ''}_${filters.status || ''}_${filters.startDate || ''}_${filters.endDate || ''}_${filters.includeStats || false}`;
    const existed = adminInvoicesCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared specific admin invoices cache: ${cacheKey}`);
    }
    
    return existed;
  } else {
    const count = adminInvoicesCache.size;
    adminInvoicesCache.clear();
    console.log(`🧹 Cleared all admin invoices cache (${count} entries)`);
    return count;
  }
}

function clearInvoicesStatsCache(range?: string) {
  if (range) {
    const cacheKey = `invoices_stats_${range}`;
    const existed = invoicesStatsCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared invoices stats cache for range: ${range}`);
    }
    
    return existed;
  } else {
    const count = invoicesStatsCache.size;
    invoicesStatsCache.clear();
    console.log(`🧹 Cleared all invoices stats cache (${count} entries)`);
    return count;
  }
}

function clearAllAdminInvoicesCache() {
  const invoicesCount = clearAdminInvoicesCache();
  const statsCount = clearInvoicesStatsCache();
  
  console.log(`🧹 Cleared all admin invoices cache (${invoicesCount} invoices, ${statsCount} stats)`);
  return { invoicesCount, statsCount };
}

async function getCachedInvoicesStats(range: string = "total") {
  const cacheKey = `invoices_stats_${range}`;
  const cached = invoicesStatsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < STATS_CACHE_TTL) {
    console.log("✅ Using cached invoices statistics");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh invoices statistics");
  
  const rangeDates = getRangeDates(range);
  
  let statsQuery = supabaseAdmin
    .from("invoices")
    .select("status, total_amount, created_at");

  if (rangeDates) {
    statsQuery = statsQuery
      .gte("created_at", rangeDates.start)
      .lte("created_at", rangeDates.end);
  }

  const { data: invoices, error } = await statsQuery;

  if (error) {
    console.error("Error fetching invoices stats:", error);
    return null;
  }

  const stats = {
    total: invoices?.length || 0,
    draft: invoices?.filter(f => f.status === "draft").length || 0,
    sent: invoices?.filter(f => f.status === "sent").length || 0,
    paid: invoices?.filter(f => f.status === "paid").length || 0,
    overdue: invoices?.filter(f => f.status === "overdue").length || 0,
    cancelled: invoices?.filter(f => f.status === "cancelled").length || 0,
    totalRevenue: invoices?.filter(f => f.status === "paid").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    pendingRevenue: invoices?.filter(f => f.status === "sent").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    byMonth: invoices?.reduce((acc, f) => {
      const date = new Date(f.created_at);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };

  invoicesStatsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now()
  });

  return stats;
}

async function getCachedAdminInvoices({
  page,
  limit,
  range,
  search,
  status,
  startDate,
  endDate,
  includeStats = false
}: AdminInvoicesQuery) {
  const cacheKey = `admin_invoices_${page}_${limit}_${range}_${search}_${status}_${startDate}_${endDate}_${includeStats}`;
  const cached = adminInvoicesCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < ADMIN_INVOICES_CACHE_TTL) {
    console.log("✅ Using cached admin invoices data");
    return {
      ...cached.data,
      _fromCache: true
    };
  }
  
  console.log("🔄 Fetching fresh admin invoices data from database");
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build the query
  let query = supabaseAdmin
    .from("invoices")
    .select("id, invoice_id, initiator_email, signee_email, status, total_amount, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply search filter
  if (search) {
    query = query.or(`invoice_id.ilike.%${search}%,initiator_email.ilike.%${search}%,signee_email.ilike.%${search}%`);
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

  const { data: invoices, error } = await query;

  if (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }

  // Get statistics if requested
  let stats = null;
  if (includeStats) {
    stats = await getCachedInvoicesStats(range);
  }

  const responseData = {
    page,
    limit,
    total: totalCount,
    range,
    invoices: invoices ?? [],
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
  adminInvoicesCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  console.log(`✅ Cached ${invoices?.length || 0} admin invoices for page ${page}`);
  
  return responseData;
}

// Only export HTTP methods
// 📄 GET: List invoices with filters and pagination
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
      clearAdminInvoicesCache({
        page, limit, range, search, status, startDate, endDate, includeStats
      });
      if (includeStats) {
        clearInvoicesStatsCache(range);
      }
      console.log(`🔄 Force refreshing admin invoices data`);
    }

    const result = await getCachedAdminInvoices({
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
    console.error("Server error (invoices route):", err);
    
    return NextResponse.json({ 
      error: err?.message?.includes('Fetch error') 
        ? 'Failed to fetch invoices' 
        : err?.message?.includes('Count error')
        ? 'Failed to count invoices'
        : 'Server error'
    }, { status: 500 });
  }
}

// 🔄 PATCH: Update invoice status
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
      .from("invoices")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🧹 CLEAR CACHE AFTER STATUS UPDATE
    console.log("🧹 Clearing cache after invoice status update...");
    clearAllAdminInvoicesCache();

    return NextResponse.json({ 
      message: "Invoice status updated", 
      data,
      cacheCleared: true
    });
  } catch (err: any) {
    console.error("Server error (invoices PATCH):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// 🗑️ DELETE: Remove an invoice
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "'id' is required to delete an invoice." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🧹 CLEAR CACHE AFTER DELETION
    console.log("🧹 Clearing cache after invoice deletion...");
    clearAllAdminInvoicesCache();

    return NextResponse.json({ 
      message: "Invoice deleted successfully",
      cacheCleared: true
    });
  } catch (err: any) {
    console.error("Server error (invoices DELETE):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}