// app/api/get-monthly-volumes/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // First day of current month in ISO
    const firstDay = new Date();
    firstDay.setDate(1);
    firstDay.setHours(0, 0, 0, 0);

    // 1) sum of deposit + withdrawal + card (monthlyVolume)
    const { data: allTx, error: allErr } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "success")
      .gte("created_at", firstDay.toISOString())
      .in("type", ["deposit", "withdrawal", "card"]);

    if (allErr) throw allErr;

    const monthlyVolume = (allTx || []).reduce(
      (s: number, r: any) => s + Number(r.amount),
      0
    );

    // 2) sum of withdrawals only (helpful if you want separate view)
    const { data: withdrawTx, error: wErr } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "success")
      .gte("created_at", firstDay.toISOString())
      .eq("type", "withdrawal");

    if (wErr) throw wErr;

    const monthlyWithdrawVolume = (withdrawTx || []).reduce(
      (s: number, r: any) => s + Number(r.amount),
      0
    );

    return NextResponse.json({
      monthlyVolume,
      monthlyWithdrawVolume,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
