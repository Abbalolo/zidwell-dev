// app/api/verify-payment/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { tx_ref, invoiceId } = await req.json();

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`,
      {
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      }
    );

    const verifyData = await verifyRes.json();

    if (
      verifyData.status === "success" &&
      verifyData.data.status === "successful"
    ) {
      await supabase
        .from("invoices")
        .update({ payment_status: "paid" })
        .eq("invoice_id", invoiceId);

      return NextResponse.json({ message: "Payment verified" });
    } else {
      return NextResponse.json(
        { message: "Payment not verified" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
