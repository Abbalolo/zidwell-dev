import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 📄 GET: List all invoices
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("id, invoice_id, initiator_email, signee_email, status, total_amount, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// 🔄 PATCH: Update invoice status
export async function PATCH(req: Request) {
  const { id, status } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Invoice updated", data });
}

// 🗑️ DELETE: Remove an invoice
export async function DELETE(req: Request) {
  const { id } = await req.json();

  const { error } = await supabaseAdmin.from("invoices").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Invoice deleted successfully" });
}
