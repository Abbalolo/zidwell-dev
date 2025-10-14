// app/api/admin-apis/transactions/summary/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INFLOW_TYPES = ["deposit", "card deposit"];
const OUTFLOW_TYPES = ["withdrawal", "airtime", "electricity", "cable", "data"];

// same helper as transactions route for date ranges
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

async function fetchNombaBalance() {
  try {
    const res = await fetch(`${process.env.NOMBA_URL}/v1/accounts/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.NOMBA_SECRET_KEY}`,
        accountId: process.env.NOMBA_ACCOUNT_ID ?? "",
      },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn("Nomba non-ok:", res.status, txt);
      return 0;
    }
    const data = await res.json();
    return Number(data?.balance ?? data?.data?.balance ?? 0);
  } catch (err) {
    console.error("Failed to fetch Nomba balance:", err);
    return 0;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") ?? "total";
    const rangeDates = getRangeDates(range);

    // 1) Fetch transactions (apply range if provided)
    let txQuery = supabaseAdmin.from("transactions").select("id, amount, type, status, created_at");
    if (rangeDates) {
      txQuery = txQuery.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
    }
    const { data: transactions, error: txError } = await txQuery;
    if (txError) {
      console.error("Error fetching transactions for summary:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }
    const allTx = transactions ?? [];

    // 2) Totals
    const totalTransactions = allTx.length;
    const totalInflow = allTx
      .filter((t: any) => INFLOW_TYPES.includes((t.type ?? "").toString().toLowerCase()))
      .reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);

    const totalOutflow = allTx
      .filter((t: any) => OUTFLOW_TYPES.includes((t.type ?? "").toString().toLowerCase()))
      .reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);

    // 3) Total users (apply range? For user counts we show total users overall when range=total,
    // and new users in range for monthlyUsers—we also return totalUsers all-time)
    const { count: totalUsersCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    const totalUsers = Number(totalUsersCount ?? 0);

    // 4) Wallet balance sum (apply range only if requested? we'll keep walletBalance as sum of all users' wallet_balance)
    const { data: usersBalances, error: ubError } = await supabaseAdmin
      .from("users")
      .select("wallet_balance");
    if (ubError) {
      console.error("Error fetching wallet balances:", ubError);
    }
    const walletBalance = (usersBalances ?? []).reduce((s: number, u: any) => s + Number(u.wallet_balance ?? 0), 0);

    // 5) Monthly transactions aggregation (group by month label within the selected range)
    const monthlyMap: Record<string, { month: string; transactions: number }> = {};
    (allTx as any[]).forEach((t) => {
      const d = new Date(t.created_at);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString("default", { month: "short", year: "numeric" }); // e.g. "Oct 2025"
      monthlyMap[key] = monthlyMap[key] ?? { month: key, transactions: 0 };
      monthlyMap[key].transactions += Number(t.amount ?? 0);
    });
    const monthlyTransactions = Object.values(monthlyMap).sort((a, b) => {
      // parse "Mon YYYY"
      const pa = new Date(a.month);
      const pb = new Date(b.month);
      return pa.getTime() - pb.getTime();
    });

    // 6) Monthly users aggregation (last 12 months if total, or within range)
    let usersForUsersMonthlyQuery;
    if (range === "total") {
      // last 12 months
      const now = new Date();
      const from = new Date(now);
      from.setMonth(now.getMonth() - 11);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      usersForUsersMonthlyQuery = supabaseAdmin
        .from("users")
        .select("id, created_at")
        .gte("created_at", from.toISOString());
    } else if (rangeDates) {
      usersForUsersMonthlyQuery = supabaseAdmin
        .from("users")
        .select("id, created_at")
        .gte("created_at", rangeDates.start)
        .lte("created_at", rangeDates.end);
    } else {
      usersForUsersMonthlyQuery = supabaseAdmin.from("users").select("id, created_at");
    }

    const { data: usersForMonthly, error: umError } = await usersForUsersMonthlyQuery;
    if (umError) {
      console.error("Error fetching users for monthly aggregation:", umError);
    }

    const usersMonthlyMap: Record<string, { month: string; users: number }> = {};
    (usersForMonthly ?? []).forEach((u: any) => {
      const d = new Date(u.created_at);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      usersMonthlyMap[key] = usersMonthlyMap[key] ?? { month: key, users: 0 };
      usersMonthlyMap[key].users += 1;
    });
    const monthlyUsers = Object.values(usersMonthlyMap).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // 7) Nomba admin wallet balance
    const nombaBalance = await fetchNombaBalance();

    return NextResponse.json({
      totalTransactions,
      totalInflow,
      totalOutflow,
      totalUsers,
      walletBalance,
      nombaBalance,
      monthlyTransactions,
      monthlyUsers,
      range,
    });
  } catch (err: any) {
    console.error("Summary API error:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
