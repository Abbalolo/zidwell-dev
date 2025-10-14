// app/api/admin-apis/transactions/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
      // ISO week, week starts Monday
      const day = now.getDay(); // 0 (Sun) - 6
      const diffToMonday = (day + 6) % 7; // days since Monday
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
      end.setDate(0); // last day of month
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const range = url.searchParams.get("range") ?? "total";
    const limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const rangeDates = getRangeDates(range);

    let query = supabaseAdmin
      .from("transactions")
      .select(
        "id, user_id, type, amount, status, reference, created_at"
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (rangeDates) {
      query = query.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error("Error fetching paginated transactions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      page,
      limit,
      range,
      transactions: transactions ?? [],
    });
  } catch (err: any) {
    console.error("Server error (transactions route):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
