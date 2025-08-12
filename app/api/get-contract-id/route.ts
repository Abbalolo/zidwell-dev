// /app/api/get-contract/route.ts
import { NextResponse } from "next/server";
import supabase from "@/app/supabase/supabase"; // Your Supabase client

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Missing ID" }, { status: 400 });
  }

  // Fetch contract using token or id (adjust field as needed)
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("token", id) 
    .single();

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ contract: data }, { status: 200 });
}
