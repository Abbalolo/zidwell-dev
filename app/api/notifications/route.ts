// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cache = new Map();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const filter = searchParams.get('filter') || 'all';
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    const cacheKey = JSON.stringify({ userId, limit, filter });
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < 3 * 60 * 1000)) {
      return NextResponse.json(cached.data);
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter === 'unread') {
      query = query.is("read_at", null);
    } else if (filter && filter !== 'all') {
      query = query.eq("type", filter);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    cache.set(cacheKey, {
      data: notifications || [],
      timestamp: now
    });

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > 10 * 60 * 1000) {
        cache.delete(key);
      }
    }

    return NextResponse.json(notifications || []);
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}