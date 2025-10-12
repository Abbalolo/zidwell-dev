import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
  
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { userId, firstName, lastName, phone, dob, address, city, state, country,pBankName,pBankCode,pAccountNumber, pAccountName  } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dob,
        address,
        city,
        state,
        country,
        p_bank_name: pBankName,
        p_bank_code: pBankCode,
        p_account_number: pAccountNumber,
        p_account_name: pAccountName,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
