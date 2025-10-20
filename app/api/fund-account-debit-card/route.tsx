// app/api/fund-with-card/route.ts
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, amount, email, reference, userId } = body;

    if (!mode)
      return NextResponse.json({ error: "Mode is required" }, { status: 400 });

    const token = await getNombaToken();
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    // INITIALIZE
    if (mode === "initialize") {
      if (!amount || !email || !userId) {
        return NextResponse.json(
          { error: "Amount, email, and userId are required" },
          { status: 400 }
        );
      }

      const orderReference = uuidv4();
      const callbackUrl = `${baseUrl}/payment/callback?ref=${orderReference}`;

      // Insert pending transaction only
      const { error: pendingError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: userId,
            type: "card_deposit",
            amount,
            status: "pending",
            reference: orderReference,
            description: "Card deposit initialization",
          },
        ]);

      if (pendingError) {
        console.error("Failed to create pending transaction:", pendingError);
        return NextResponse.json(
          { error: "Failed to initialize transaction" },
          { status: 500 }
        );
      }

      const nombaPayload = {
        order: {
          orderReference,
          callbackUrl,
          customerEmail: email,
          amount,
          currency: "NGN",
          accountId: process.env.NOMBA_ACCOUNT_ID,
        },
        paymentMethod: {
          channels: ["card"], 
        },
      };

      const nombaRes = await fetch(
        `${process.env.NOMBA_URL}/v1/checkout/order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nombaPayload),
        }
      );

      const initData = await nombaRes.json();
      if (!nombaRes.ok) {
        console.error("Nomba init error:", initData);
        return NextResponse.json(
          { error: initData?.message || "Failed to initialize payment" },
          { status: nombaRes.status }
        );
      }

      return NextResponse.json({
        status: "initialized",
        paymentUrl: initData?.data?.checkoutLink,
        reference: orderReference,
      });
    }

    // VERIFY (optional) – frontend only, no wallet update
    if (mode === "verify") {
      if (!reference)
        return NextResponse.json(
          { error: "Transaction reference is required" },
          { status: 400 }
        );

      const verifyRes = await fetch(
        `${process.env.NOMBA_URL}/v1/transactions/accounts/single?orderReference=${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            "Content-Type": "application/json",
          },
        }
      );

      const verifyData = await verifyRes.json();
      return NextResponse.json({
        status:
          verifyData?.data?.results?.[0]?.status || verifyData?.data?.status,
        data: verifyData?.data,
      });
    }

    return NextResponse.json(
      { error: "Invalid mode. Use 'initialize' or 'verify'." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Fund account API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
