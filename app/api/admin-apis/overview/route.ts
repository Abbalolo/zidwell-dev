// app/api/admin/overview/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all data in parallel (without RPC)
    const [usersRes, txRes, balanceRes] = await Promise.all([
      supabaseAdmin.from("users").select("id"),
      supabaseAdmin.from("transactions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("wallet_balance"),
    ]);

    if (usersRes.error) throw new Error(`Users query failed: ${usersRes.error.message}`);
    if (txRes.error) throw new Error(`Transactions query failed: ${txRes.error.message}`);
    if (balanceRes.error) throw new Error(`Balances query failed: ${balanceRes.error.message}`);

    // Calculate total balance in JS
    const totalBalance = balanceRes.data?.reduce(
      (acc, row: any) => acc + (Number(row.balance) || 0),
      0
    );

    return NextResponse.json({
      totalUsers: usersRes.data?.length ?? 0,
      totalTransactions: txRes.count ?? 0,
      totalBalance: totalBalance ?? 0,
    });
  } catch (error: any) {
    console.error("❌ Admin overview error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
