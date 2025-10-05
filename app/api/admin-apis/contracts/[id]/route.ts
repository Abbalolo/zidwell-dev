import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔄 PATCH: Update contract status
export async function PATCH(
  req: NextRequest,
   { params }: { params: Promise<{ id: any }> }
) {

   const id = (await params).id;

  const { status } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("contracts")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Contract updated", data });
}

// 🗑️ DELETE: Remove a contract
export async function DELETE(
   _: NextRequest,
   { params }: { params: Promise<{ id: any }> }
) {

  const id = (await params).id; 
  const { error } = await supabaseAdmin.from("contracts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Contract deleted successfully" });
}
