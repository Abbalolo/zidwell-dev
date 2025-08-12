// app/api/save-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/supabase/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      email,
      firstName,
      lastName,
      phone,
      walletId,
      bankAccountName,
      bankAccountNumber,
      bankName,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }


   
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone,
          walletId,
          bankName,
          bankAccountName,
          bankAccountNumber,
          loginAt: new Date().toISOString(),
        },
        { onConflict: "email" } // ensures update if email exists
      );

    if (error) {
      console.error("❌ Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Unexpected Error:", error.message);
    return NextResponse.json(
      { error: "Failed to save user to Supabase" },
      { status: 500 }
    );
  }
}
