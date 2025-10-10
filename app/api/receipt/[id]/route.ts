// app/api/invoice/[id]/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: any }> }
) {
  const id = (await params).id;

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ message: "receipt not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: any }> }
) {
  const id = (await params).id;
  const updates = await req.json();

  const { error } = await supabase
    .from("receipts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to update receipt" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "receipt updated successfully" });
}
