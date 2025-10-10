// /app/api/total-inflow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Fetch all transactions for this user
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount,type,status")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!transactions) {
    return NextResponse.json({ totalInflow: 0, totalOutflow: 0, successRate: 0 });
  }

  // Inflow types
  const inflowTypes = ["deposit", "card deposit"];
  // Outflow types
  const outflowTypes = ["withdrawal", "airtime", "electricity", "cable", "data"];

  // Calculate total inflow
  const totalInflow = transactions
    .filter((tx) => inflowTypes.includes(tx.type))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // Calculate total outflow
  const totalOutflow = transactions
    .filter((tx) => outflowTypes.includes(tx.type))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // Success rate = (successful transactions / total transactions) * 100
  const successfulTransactions = transactions.filter((tx) => tx.status === "success");
  const successRate =
    transactions.length > 0
      ? Math.round((successfulTransactions.length / transactions.length) * 100)
      : 0;

  return NextResponse.json({ totalInflow, totalOutflow, successRate });
}
