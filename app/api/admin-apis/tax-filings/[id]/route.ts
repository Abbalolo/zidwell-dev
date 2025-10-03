import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 📄 GET: Retrieve a single tax filing by ID
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from("tax_filings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 🔄 PATCH: Update a single tax filing status or fields
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("tax_filings")
    .update(body)
    .eq("id", params.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Tax filing updated successfully", data });
}

// 🗑️ DELETE: Delete a single tax filing
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from("tax_filings")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Tax filing deleted successfully" });
}
