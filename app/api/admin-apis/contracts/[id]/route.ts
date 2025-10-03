import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔄 PATCH: Update contract status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { status } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("contracts")
    .update({ status })
    .eq("id", params.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Contract updated", data });
}

// 🗑️ DELETE: Remove a contract
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin.from("contracts").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Contract deleted successfully" });
}
