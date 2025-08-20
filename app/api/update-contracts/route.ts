import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function POST(req: Request) {
  const data = await req.json();

  if (!data.id) {
    return NextResponse.json({ message: "Missing ID" }, { status: 400 });
  }

  const { contractTitle, contractText, description = "" } = data;

  const { error } = await supabase
    .from("contracts")
    .update({
      contract_title: contractTitle,
      contract_text: contractText,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("token", data.id);

  if (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json(
      { message: "Failed to update contract" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Updated successfully" });
}
