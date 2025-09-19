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
    const bankStatement = formData.get("bankStatement") as File;

    // Upload bank statement
    const ext = bankStatement.name.split(".").pop();
    const path = `${userId}/${Date.now()}-${bankStatement.name}`;
    const { error: uploadError } = await supabase.storage
      .from("tax_doc")
      .upload(path, bankStatement, { contentType: bankStatement.type });

     

    if (uploadError) throw uploadError;

    const bankStatementUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/tax_docs/${path}`;

   
    // Insert returning filing
    const { error: dbError } = await supabase.from("tax_filings").insert({
      user_id: userId,
      filing_type: "returning",
      bank_statement_url: bankStatementUrl,
    });


    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "Returning filing submitted!" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
