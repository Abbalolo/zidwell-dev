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

    if (!mode) {
      return NextResponse.json({ error: "Mode is required" }, { status: 400 });
    }

    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    // 1) INITIALIZE
    if (mode === "initialize") {
      if (!amount || !email || !userId) {
        return NextResponse.json(
          { error: "Amount, email, and userId are required" },
          { status: 400 }
        );
      }

      // generate an order reference that will be saved to transactions BEFORE contacting Nomba
      const orderReference = uuidv4();
      const callbackUrl = `${baseUrl}/payment/callback?ref=${orderReference}`;

      // Insert pending transaction so the webhook can find user -> always insert BEFORE calling Nomba
      const { error: pendingError } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          type: "card deposit",
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
          amount: amount,
          currency: "NGN",
          accountId: process.env.NOMBA_ACCOUNT_ID,
        },
      };

      const nombaRes = await fetch(`${process.env.NOMBA_URL}/v1/checkout/order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nombaPayload),
      });

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

    // 2) VERIFY mode (optional fallback if you want to verify from frontend)
    if (mode === "verify") {
      if (!reference) {
        return NextResponse.json(
          { error: "Transaction reference is required" },
          { status: 400 }
        );
      }

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

      // Verify with Nomba
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
      const rawAmount = Number(verifyData?.data?.results?.[0]?.amount) || 0;

      if (paymentStatus === "SUCCESS" || paymentStatus === "SUCCESSFUL") {
        // Prevent double credit here by checking existing transaction status
        const { data: tx, error: txErr } = await supabase
          .from("transactions")
          .select("*")
          .eq("reference", reference)
          .maybeSingle();

        if (!tx) {
          // no pending transaction: attempt to insert one and then credit safely
          const { error: insertErr } = await supabase.from("transactions").insert([
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

          if (insertErr && insertErr.code === "23505") {
            // duplicate insert - already processed
          } else if (insertErr) {
            console.error("Transaction insert error:", insertErr);
            return NextResponse.json(
              { error: "Wallet funded, but failed to log transaction" },
              { status: 500 }
            );
          } else {
            // credit wallet
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
          }
        } else if (tx.status !== "success") {
          // pending transaction exists — use atomic RPC to mark success and credit
          const { data: rpcResp, error: rpcErr } = await supabase.rpc(
            "credit_deposit_if_pending",
            { ref: reference, amt: rawAmount }
          );
          if (rpcErr) {
            console.error("RPC error:", rpcErr);
            return NextResponse.json({ error: "RPC error" }, { status: 500 });
          }
          // rpcResp will be 'OK' or 'ALREADY_PROCESSED' etc.
        } else {
          // already success - no-op
        }
      } else {
        // failed payment - record failed attempt if needed
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

    // invalid mode
    return NextResponse.json({ error: "Invalid mode. Use 'initialize' or 'verify'." }, { status: 400 });
  } catch (error: any) {
    console.error("Fund account API error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}


        