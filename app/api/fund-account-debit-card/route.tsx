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

    if (!mode) {
      return NextResponse.json({ error: "Mode is required" }, { status: 400 });
    }

    // ✅ Get Nomba access token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    // ==========================================
    // 🟡 1️⃣ INITIALIZE PAYMENT
    // ==========================================
    if (mode === "initialize") {
      if (!amount || !email || !userId) {
        return NextResponse.json(
          { error: "Amount, email, and userId are required" },
          { status: 400 }
        );
      }

      const orderReference = uuidv4();
      const callbackUrl = `${baseUrl}/payment/success?userId=${userId}`;

      const nombaPayload = {
        order: {
          orderReference,
          callbackUrl,
          customerEmail: email,
          amount: amount, // ✅ Naira directly
          currency: "NGN",
          accountId: process.env.NOMBA_ACCOUNT_ID,
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

    // ==========================================
    // 🟢 2️⃣ VERIFY PAYMENT
    // ==========================================
    if (mode === "verify") {
      if (!reference) {
        return NextResponse.json(
          { error: "Transaction reference is required" },
          { status: 400 }
        );
      }

      // ✅ If userId missing, resolve it from email
      let resolvedUserId = userId;
      if (!resolvedUserId && email) {
        const { data: userLookup } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();
        resolvedUserId = userLookup?.id;
      }

      if (!resolvedUserId) {
        return NextResponse.json(
          { error: "User ID is missing and could not be resolved" },
          { status: 400 }
        );
      }

      // ✅ Verify with Nomba API
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
      if (!verifyRes.ok || !verifyData?.data) {
        return NextResponse.json(
          { error: verifyData.message || "Payment verification failed" },
          { status: verifyRes.status }
        );
      }

      const paymentStatus =
        verifyData?.data?.results?.[0]?.status || verifyData?.data?.status;

      // ✅ Get amount in naira directly
      const rawAmount = Number(verifyData?.data?.results?.[0]?.amount) || 0;

      console.log("rawAmount", rawAmount);
      // ==========================================
      // 💸 3️⃣ CREDIT WALLET VIA RPC
      // ==========================================
      if (paymentStatus === "SUCCESS" || paymentStatus === "SUCCESSFUL") {
        
        const { error: rpcError } = await supabase.rpc("increment_wallet_balance", {
          user_id: resolvedUserId,
          amt: rawAmount,
        });

        if (rpcError) {
          console.error("RPC wallet update error:", rpcError);
          return NextResponse.json(
            { error: "Failed to credit wallet", details: rpcError.message },
            { status: 500 }
          );
        }

        // ✅ Log transaction
        const { error: txnError } = await supabase.from("transactions").insert([
          {
            user_id: resolvedUserId,
            type: "card deposit",
            amount: rawAmount,
            status: "success",
            reference,
            description: `Wallet funded with ₦${rawAmount}`,
            merchant_tx_ref: verifyData?.data?.orderReference || reference,
          },
        ]);

        if (txnError) {
          console.error("Transaction insert error:", txnError);
          return NextResponse.json(
            { error: "Wallet funded, but failed to log transaction" },
            { status: 500 }
          );
        }
      } else {
        // ❌ Log failed attempt
        await supabase.from("transactions").insert([
          {
            user_id: resolvedUserId,
            type: "card deposit",
            amount: rawAmount,
            status: paymentStatus,
            reference,
            description: "Payment attempt failed",
          },
        ]);
      }

      return NextResponse.json({
        status: paymentStatus,
        message: verifyData?.message || "Payment verification complete",
        data: verifyData?.data,
      });
    }

    // ❌ Invalid mode
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
