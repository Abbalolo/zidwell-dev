// app/api/admin-apis/receipts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      console.error("Error counting receipts:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: receipts, error } = await query;

    if (error) {
      console.error("Error fetching paginated receipts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      page,
      limit,
      total: totalCount,
      range,
      receipts: receipts ?? [],
    });
  } catch (err: any) {
    console.error("Server error (receipts route):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
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

    return NextResponse.json({ message: "Receipt updated", data });
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

    return NextResponse.json({ message: "Receipt deleted successfully" });
  } catch (err: any) {
    console.error("Server error (receipts DELETE):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}