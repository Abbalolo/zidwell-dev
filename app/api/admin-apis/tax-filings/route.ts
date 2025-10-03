import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 📄 GET: List all tax filings
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("tax_filings")
    .select(`
      id,
      user_id,
      filing_type,
      first_name,
      middle_name,
      last_name,
      company_name,
      business_address,
      nin,
      address_proof_url,
      id_card_url,
      bank_statement_url,
      status,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 🔄 PATCH: Bulk update filing status (optional)
export async function PATCH(req: Request) {
  const { id, status } = await req.json();

  if (!id || !status) {
    return NextResponse.json(
      { error: "Both 'id' and 'status' are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("tax_filings")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Tax filing status updated", data });
}

// 🗑️ DELETE: Remove a filing
export async function DELETE(req: Request) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "'id' is required to delete a filing." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("tax_filings")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Tax filing deleted successfully" });
}
