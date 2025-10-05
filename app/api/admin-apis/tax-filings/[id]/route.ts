import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 📄 GET: Retrieve a single tax filing by ID
export async function GET(  req: NextRequest,
   { params }: { params: Promise<{ id: any }> }
) {

   const id = (await params).id;

  const { data, error } = await supabaseAdmin
    .from("tax_filings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 🔄 PATCH: Update a single tax filing status or fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: any }> }) {
  const id = (await params).id;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("tax_filings")
    .update(body)
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Tax filing updated successfully", data });
}

// 🗑️ DELETE: Delete a single tax filing
export async function DELETE(
   _: NextRequest,
   { params }: { params: Promise<{ id: any }> }
) {

  const id = (await params).id; 

  const { error } = await supabaseAdmin
    .from("tax_filings")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Tax filing deleted successfully" });
}
