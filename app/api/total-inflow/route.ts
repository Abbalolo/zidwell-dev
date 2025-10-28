import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
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
    .select("amount, type, status, created_at, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({
      totalInflow: 0,
      totalOutflow: 0,
      totalTransactions: 0
    });
  }


  const inflowTypes = [
    "deposit",                    
    "virtual_account_deposit",   
    "card_deposit",             
    "p2p_received",              
    "referral",                  
    "referral_reward"            
  ];

  const outflowTypes = [
    "withdrawal",                
    "debit",                   
    "airtime",                   
    "data",                      
    "electricity",             
    "cable",                    
    "transfer"                   
  ];

  // Filter only SUCCESSFUL transactions
  const successfulTransactions = transactions.filter(tx => tx.status === 'success');

  // Calculate totals
  const inflowTransactions = successfulTransactions.filter(tx => inflowTypes.includes(tx.type));
  const outflowTransactions = successfulTransactions.filter(tx => outflowTypes.includes(tx.type));

  // Log transaction types for debugging
  const typeCounts: { [key: string]: number } = {};
  successfulTransactions.forEach(tx => {
    typeCounts[tx.type] = (typeCounts[tx.type] || 0) + 1;
  });
 

  const totalInflow = inflowTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalOutflow = outflowTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalTransactions = successfulTransactions.length;


  return NextResponse.json({
    totalInflow,
    totalOutflow,
    totalTransactions,
    netFlow: totalInflow - totalOutflow
  });
}