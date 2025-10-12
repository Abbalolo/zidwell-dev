import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      businessName,
      businessType,
      rcNumber,
      taxId,
      businessAddress,
      businessDescription,
      // bankName,
      // bankCode,
      // accountNumber,
      // accountName,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Check if business already exists
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let result;
    if (existing) {
  
      result = await supabase
        .from("businesses")
        .update({
          business_name: businessName,
          business_category: businessType,
          registration_number: rcNumber,
          tax_id: taxId,
          business_address: businessAddress,
          business_description: businessDescription,
          // bank_name: bankName,
          // bank_code: bankCode,
          // bank_account_number: accountNumber,
          // bank_account_name: accountName,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      // ✅ Insert new business
      result = await supabase.from("businesses").insert([
        {
          user_id: userId,
          business_name: businessName,
          business_category: businessType,
          registration_number: rcNumber,
          tax_id: taxId,
          business_address: businessAddress,
          business_description: businessDescription,
          // bank_name: bankName,
          // bank_code: bankCode,
          // bank_account_number: accountNumber,
          // bank_account_name: accountName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update business info", details: error.message },
      { status: 500 }
    );
  }
}
