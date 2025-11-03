import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// import { clearBusinessDataCache } from "../../get-business-account-details/route";
// import { clearWalletBalanceCache } from "../../wallet-balance/route";
// import { clearTransactionsCache } from "../../bill-transactions/route";

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
      cacFileBase64, 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    let cacFileUrl: string | null = null;

    // ✅ Upload CAC file to Supabase Storage if provided
    if (cacFileBase64) {
      const fileBuffer = Buffer.from(cacFileBase64.split(",")[1], "base64");
      const fileExt = cacFileBase64.startsWith("data:image") ? "png" : "pdf";
      const filePath = `cac/${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc")
        .upload(filePath, fileBuffer, {
          contentType: fileExt === "pdf" ? "application/pdf" : "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return NextResponse.json(
          { error: "Failed to upload CAC document" },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("kyc")
        .getPublicUrl(filePath);

      cacFileUrl = publicUrlData?.publicUrl ?? null;
    }

    // Check if business already exists
    const { data: existing, error: fetchError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

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
          cac_file_url: cacFileUrl ?? undefined, // ✅ Save CAC URL
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
          cac_file_url: cacFileUrl ?? null, // ✅ Save CAC URL
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    if (result.error) throw result.error;

    //  clearBusinessDataCache(userId)
    //   clearWalletBalanceCache(userId);
    //       clearTransactionsCache(userId);

    return NextResponse.json({ success: true, cacFileUrl });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update business info", details: error.message },
      { status: 500 }
    );
  }
}
