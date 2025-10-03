// app/api/admin/wallets/route.ts
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 📊 GET: List top wallets
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, balance, currency")
    .order("balance", { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ wallets: data })
}

// 💰 POST: Manually adjust user balance
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, amount, reason } = body

    if (!user_id || !amount) {
      return NextResponse.json({ error: "user_id and amount are required" }, { status: 400 })
    }

    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Amount must be a valid number" }, { status: 400 })
    }

    // ✅ Step 1: Update user balance
    const { data: updatedUser, error: balanceError } = await supabaseAdmin
      .from("users")
      .update({ balance: supabaseAdmin.rpc("increment_balance", { user_id, amount: parsedAmount }) }) // optional: RPC method
      .eq("id", user_id)
      .select("id, balance")
      .single()

    if (balanceError) throw new Error(balanceError.message)

    // ✅ Step 2: Insert transaction record
    const { error: txError } = await supabaseAdmin.from("transactions").insert([
      {
        user_id,
        type: "admin_adjust",
        amount: parsedAmount,
        status: "completed",
        reference: reason || "Admin balance adjustment",
      },
    ])

    if (txError) throw new Error(txError.message)

    return NextResponse.json({
      message: "Balance updated successfully",
      new_balance: updatedUser?.balance,
    })
  } catch (error: any) {
    console.error("💥 Wallet adjust error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
