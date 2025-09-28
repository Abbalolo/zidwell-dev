import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("invoiceId");
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("status, public_token") 
      .eq("invoice_id", invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: invoice.status,
      public_token: invoice.public_token, 
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
