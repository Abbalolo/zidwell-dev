// app/api/summary/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Nomba caching (1 minute)
let _cachedNomba = { ts: 0, value: 0 };
const NOMBA_CACHE_TTL = 60 * 1000;

async function fetchNombaBalanceCached(
  getTokenFn: () => Promise<string | null>
) {
  try {
    const now = Date.now();
    if (now - _cachedNomba.ts < NOMBA_CACHE_TTL) {
      console.log("Using cached Nomba balance");
      return _cachedNomba.value;
    }

    const token = await getTokenFn();
    if (!token) {
      console.warn("No Nomba token available");
      return 0;
    }

    const res = await fetch(
      `${process.env.NOMBA_URL ?? ""}/v1/accounts/balance`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID ?? "",
        },
      }
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Nomba fetch failed:", res.status, txt);
      return 0;
    }

    const data = await res.json().catch(() => ({}));
    const amount = Number(data?.data?.amount ?? 0);
    _cachedNomba = { ts: now, value: amount };
    return amount;
  } catch (err) {
    console.error("Error fetching Nomba balance:", err);
    return 0;
  }
}

import { getNombaToken } from "@/lib/nomba";

function parseRangeToDates(range: string | null) {
  if (!range || range === "total") return null;
  const now = new Date();
  let start = new Date(now);
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
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      return null;
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

function buildMonthLabelsFromRange(
  rangeDates: { start: string; end: string } | null
) {
  const labels: string[] = [];
  if (!rangeDates) {
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(
        d.toLocaleString("default", { month: "short", year: "numeric" })
      );
    }
  } else {
    const start = new Date(rangeDates.start);
    const end = new Date(rangeDates.end);
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      labels.push(
        cur.toLocaleString("default", { month: "short", year: "numeric" })
      );
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return labels;
}

export async function GET(req: Request) {
  try {
    console.log("[/api/summary] incoming request");

    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range") ?? "total";
    const rangeDates = parseRangeToDates(rangeParam);

    // --- Transactions (apply range if provided) ---
    // REMOVED: .eq("status", "success") filter to include all transactions
    let txQuery = supabaseAdmin
      .from("transactions")
      .select("id, amount, type, status, created_at")
      .order("created_at", { ascending: false });
    
    if (rangeDates) {
      txQuery = txQuery
        .gte("created_at", rangeDates.start)
        .lte("created_at", rangeDates.end);
    }

    const { data: transactions = [], error: txError } = await txQuery;
    if (txError) {
      console.error("[/api/summary] error fetching transactions:", txError);
    } else {
      console.log(
        "[/api/summary] transactions fetched:",
        (transactions as any[]).length,
        "including all statuses"
      );
    }

    // Transaction aggregates - now including all statuses
    const INFLOW_TYPES = [
      "deposit",
      "card_deposit",
      "referral",
      "referral_reward",
      "p2p_received",
    ];

    const OUTFLOW_TYPES = [
      "withdrawal",
      "airtime",
      "electricity",
      "cable",
      "data",
      "debit",
    ];

    const totalTransactions = (transactions ?? []).length;

    // Calculate successful transactions only for specific metrics if needed
    const successfulTransactions = (transactions ?? []).filter(
      (t: any) => t.status === "success"
    );
    const failedTransactions = (transactions ?? []).filter(
      (t: any) => t.status === "failed"
    );
    const pendingTransactions = (transactions ?? []).filter(
      (t: any) => t.status === "pending"
    );

    // For financial calculations, you might still want only successful transactions
    const totalInflow = successfulTransactions
      .filter((t: any) =>
        INFLOW_TYPES.includes((t.type ?? "").toString().toLowerCase())
      )
      .reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);

    const totalOutflow = successfulTransactions
      .filter((t: any) =>
        OUTFLOW_TYPES.includes((t.type ?? "").toString().toLowerCase())
      )
      .reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);

    // latestTransactions (last 5) - now includes all statuses
    const latestTransactions = (transactions ?? [])
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount ?? 0),
        status: t.status,
        created_at: t.created_at,
      }));

    // --- Users wallet balance (sum wallet_balance across users) ---
    const { data: usersBalances = [], error: ubError } = await supabaseAdmin
      .from("users")
      .select("wallet_balance");
    if (ubError)
      console.error("[/api/summary] users wallet fetch error:", ubError);
    const mainWalletBalance = (usersBalances ?? []).reduce(
      (s: number, u: any) => s + Number(u.wallet_balance ?? 0),
      0
    );

    // --- Users total count ---
    const { count: totalUsersCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });
    const totalUsers = Number(totalUsersCount ?? 0);

    // --- Contracts stats (apply range if provided) ---
    let contractsQuery = supabaseAdmin
      .from("contracts")
      .select("id, status, created_at");
    if (rangeDates) {
      contractsQuery = contractsQuery
        .gte("created_at", rangeDates.start)
        .lte("created_at", rangeDates.end);
    }
    const { data: contractsData = [], error: contractsError } =
      await contractsQuery;
    if (contractsError)
      console.error("[/api/summary] contracts fetch error:", contractsError);
    const totalContractsIssued = (contractsData ?? []).length;

    const pendingContracts = (contractsData ?? []).filter(
      (c: any) => (c.status ?? "pending") === "pending"
    ).length;
    const signedContracts = (contractsData ?? []).filter(
      (c: any) => (c.status ?? "").toLowerCase() === "signed"
    ).length;

    // monthlyContracts breakdown
    const monthLabels = buildMonthLabelsFromRange(rangeDates);
    const monthlyContractsMap: Record<string, number> = {};
    (contractsData ?? []).forEach((c: any) => {
      const d = new Date(c.created_at);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyContractsMap[key] = (monthlyContractsMap[key] ?? 0) + 1;
    });
    const monthlyContracts = monthLabels.map((m) => ({
      month: m,
      count: monthlyContractsMap[m] ?? 0,
    }));

    // --- Invoices stats (apply range if provided) ---
    let invoicesQuery = supabaseAdmin
      .from("invoices")
      .select("id, status, created_at, paid_amount");
    if (rangeDates) {
      invoicesQuery = invoicesQuery
        .gte("created_at", rangeDates.start)
        .lte("created_at", rangeDates.end);
    }
    const { data: invoicesData = [], error: invoicesError } =
      await invoicesQuery;
    if (invoicesError)
      console.error("[/api/summary] invoices fetch error:", invoicesError);
    const totalInvoicesIssued = (invoicesData ?? []).length;
    const paidInvoices = (invoicesData ?? []).filter(
      (inv: any) => (inv.status ?? "").toLowerCase() === "paid"
    ).length;
    const unpaidInvoices = (invoicesData ?? []).filter(
      (inv: any) => (inv.status ?? "").toLowerCase() === "unpaid"
    ).length;
    const totalInvoiceRevenue = (invoicesData ?? [])
      .filter((inv: any) => (inv.status ?? "").toLowerCase() === "paid")
      .reduce(
        (s: number, inv: any) =>
          s + Number(inv.paid_amount ?? inv.total_amount ?? 0),
        0
      );

    // monthlyInvoices breakdown (count + revenue)
    const monthlyInvoicesMap: Record<
      string,
      { count: number; revenue: number }
    > = {};
    (invoicesData ?? []).forEach((inv: any) => {
      const d = new Date(inv.created_at);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyInvoicesMap[key] = monthlyInvoicesMap[key] ?? {
        count: 0,
        revenue: 0,
      };
      monthlyInvoicesMap[key].count += 1;
      if ((inv.status ?? "").toLowerCase() === "paid") {
        monthlyInvoicesMap[key].revenue += Number(
          inv.paid_amount ?? inv.total_amount ?? 0
        );
      }
    });
    const monthlyInvoices = monthLabels.map((m) => ({
      month: m,
      count: monthlyInvoicesMap[m]?.count ?? 0,
      revenue: monthlyInvoicesMap[m]?.revenue ?? 0,
    }));

    // --- Monthly transactions breakdown (sum amounts per month) ---
    // For monthly breakdown, you might still want only successful transactions
    const monthlyTransactionsMap: Record<string, number> = {};
    successfulTransactions.forEach((t: any) => {
      const d = new Date(t.created_at);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyTransactionsMap[key] =
        (monthlyTransactionsMap[key] ?? 0) + Number(t.amount ?? 0);
    });
    const monthlyTransactions = monthLabels.map((m) => ({
      month: m,
      transactions: monthlyTransactionsMap[m] ?? 0,
    }));

    // --- Nomba balance (cached) ---
    const nombaBalance = await fetchNombaBalanceCached(async () => {
      try {
        return await getNombaToken();
      } catch (err) {
        console.error("getNombaToken error:", err);
        return null;
      }
    });

    // --- final response with transaction status breakdown ---
    const response = {
      totalInflow,
      totalOutflow,
      mainWalletBalance,
      nombaBalance,
      totalTransactions,
      totalUsers,
      pendingInvoices: unpaidInvoices,
      paidInvoices,
      totalInvoicesIssued,
      totalInvoiceRevenue,
      pendingContracts,
      signedContracts,
      totalContractsIssued,
      latestTransactions,
      monthlyTransactions,
      monthlyInvoices,
      monthlyContracts,
      range: rangeParam,
      
      // NEW: Transaction status breakdown
      transactionStatus: {
        success: successfulTransactions.length,
        failed: failedTransactions.length,
        pending: pendingTransactions.length,
      },
      
      // NEW: Include all transactions count by status in the main response
      successfulTransactions: successfulTransactions.length,
      failedTransactions: failedTransactions.length,
      pendingTransactions: pendingTransactions.length,
    };

    console.log("[/api/summary] response built with all transactions");
    console.log("[/api/summary] Transaction breakdown:", {
      total: totalTransactions,
      success: successfulTransactions.length,
      failed: failedTransactions.length,
      pending: pendingTransactions.length,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/summary] Unhandled error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}