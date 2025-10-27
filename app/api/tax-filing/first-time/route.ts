import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const userId = formData.get("userId") as string;
    const firstName = formData.get("firstName") as string;
    const middleName = formData.get("middleName") as string | null;
    const lastName = formData.get("lastName") as string;
    const companyName = formData.get("companyName") as string;
    const businessAddress = formData.get("businessAddress") as string;
    const nin = formData.get("nin") as string;

    // Files
    const addressProof = formData.get("addressProof") as File | null;
    const idCard = formData.get("idCard") as File | null;
    const bankStatement = formData.get("bankStatement") as File;

    // Upload files to Supabase Storage
    const uploadFile = async (bucket: string, file: File | null) => {
  if (!file) return null;

  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}-${file.name}`;

  // Convert the file to an ArrayBuffer — supported by Supabase Storage
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
};


    

    const addressProofUrl = await uploadFile("tax_doc", addressProof);
    const idCardUrl = await uploadFile("tax_doc", idCard);
    const bankStatementUrl = await uploadFile("tax_doc", bankStatement);

    // Insert into DB
    const { error: dbError } = await supabase.from("tax_filings").insert({
      user_id: userId,
      filing_type: "first-time",
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      company_name: companyName,
      business_address: businessAddress,
      nin,
      address_proof_url: addressProofUrl,
      id_card_url: idCardUrl,
      bank_statement_url: bankStatementUrl,
    });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "First-time filing submitted!" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
