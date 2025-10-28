// app/api/admin-apis/notifications/route.ts
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

// GET: List notifications with filters and pagination
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 15);
    const range = url.searchParams.get("range") ?? "total";
    const search = url.searchParams.get("search") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const channel = url.searchParams.get("channel") ?? "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the query
    let query = supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%,target_audience.ilike.%${search}%`);
    }

    // Apply type filter
    if (type) {
      query = query.eq("type", type);
    }

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Apply channel filter
    if (channel) {
      query = query.contains("channels", [channel]);
    }

    // Apply date range filter
    const rangeDates = getRangeDates(range);
    if (rangeDates) {
      query = query.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
    }

    // Get total count for pagination
    const { data: countData, error: countError, count } = await query;
    const totalCount = count || 0;

    if (countError) {
      console.error("Error counting notifications:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching paginated notifications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      page,
      limit,
      total: totalCount,
      range,
      notifications: notifications ?? [],
    });
  } catch (err: any) {
    console.error("Server error (notifications route):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// POST: Create new notification
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { 
      title, 
      message, 
      type, 
      channels, 
      target_audience, 
      scheduled_for, 
      is_urgent 
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Determine status based on scheduling
    const status = scheduled_for ? "scheduled" : "draft";

    const { data: notification, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        title,
        message,
        type: type || "info",
        channels: channels || ["in_app"],
        target_audience: target_audience || "all_users",
        scheduled_for: scheduled_for || null,
        is_urgent: is_urgent || false,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If immediate send is requested (no schedule), send now
    if (!scheduled_for) {
      // Here you would integrate with your notification services
      // For now, we'll just update the status to sent
      await supabaseAdmin
        .from("notifications")
        .update({ 
          status: "sent",
          sent_at: new Date().toISOString()
        })
        .eq("id", notification.id);
    }

    return NextResponse.json(notification);
  } catch (err: any) {
    console.error("Server error (notifications POST):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}