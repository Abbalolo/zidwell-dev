import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 📄 GET: List all receipts
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("receipts")
    .select("id, receipt_id, initiator_email, signee_email, status, amount_balance, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// 🔄 PATCH: Update receipt status
export async function PATCH(req: Request) {
  const { id, status } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("receipts")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Receipt updated", data });
}

// 🗑️ DELETE: Remove a receipt
export async function DELETE(req: Request) {
  const { id } = await req.json();

  const { error } = await supabaseAdmin.from("receipts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Receipt deleted successfully" });
}
