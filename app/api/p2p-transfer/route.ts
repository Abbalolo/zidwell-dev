import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { userId, receiverAccountId, amount, narration } = await req.json();


    // 2. Fetch sender balance
    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("first_name, last_name, wallet_balance")
      .eq("id", userId)
      .single();

    if (senderError || !sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    if (sender.wallet_balance < amount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fee)" },
        { status: 400 }
      );
    }

    // 3. Fetch receiver balance
    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select("first_name, last_name, wallet_balance ")
      .eq("wallet_id", receiverAccountId)
      .single();

    if (receiverError || !receiver) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 }
      );
    }

    // 4. Create pending transaction for sender
    const merchantTxRef = `P2P_${Date.now()}`;

    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "p2p_transfer",
        amount,
        status: "pending",
        description: `P2P transfer to ${receiver?.first_name} ${receiver?.last_name}`,
        merchant_tx_ref: merchantTxRef,
      })
      .select("id")
      .single();

    if (txError) {
      console.log("txError", txError);
      return NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
    }

    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ 5. Call Nomba Wallet API for actual transfer
    try {
      const nombaRes = await fetch(
        `${process.env.NOMBA_URL}/v1/transfers/wallet`,
        {
          method: "POST",
          headers: {
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            receiverAccountId,
            merchantTxRef,
            narration: narration || "P2P Transfer",
          }),
        }
      );

      const nombaData = await nombaRes.json();
      console.log("🔁 Nomba API response:", nombaData);

      if (!nombaRes.ok) {
        console.error("❌ Nomba Transfer Failed:", nombaData);
        return NextResponse.json(
          { error: "Nomba transfer failed", detail: nombaData },
          { status: 502 }
        );
      }
    } catch (apiErr: any) {
      console.error("❌ Nomba API Error:", apiErr.message);
      return NextResponse.json(
        { error: "Failed to contact Nomba API", detail: apiErr.message },
        { status: 502 }
      );
    }

    // ✅ 6. Update balances in Supabase
    await supabase
      .from("users")
      .update({
        wallet_balance: sender.wallet_balance - amount,
      })
      .eq("id", userId);

    await supabase
      .from("users")
      .update({
        wallet_balance: receiver.wallet_balance + amount,
      })
      .eq("wallet_id", receiverAccountId);

    // ✅ 7. Update sender transaction to success
    await supabase
      .from("transactions")
      .update({
        status: "success",
        reference: merchantTxRef,
      })
      .eq("id", pendingTx.id);

   

    // ✅ 9. Add transaction history for receiver
    await supabase.from("transactions").insert({
      user_id: receiverAccountId,
      type: "p2p_received",
      amount,
      status: "success",
      description: `Received ₦${amount} from ${sender?.first_name} ${sender?.last_name}`,
      merchant_tx_ref: merchantTxRef,
    });

    return NextResponse.json({
      status: "success",
      message: "P2P transfer completed successfully",
      amount,
      reference: merchantTxRef,
    });
  } catch (error: any) {
    console.error("P2P Transfer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
