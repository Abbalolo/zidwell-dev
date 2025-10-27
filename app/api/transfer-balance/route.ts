// // app/api/withdraw/route.ts
// import { NextResponse } from "next/server";
// import { getNombaToken } from "@/lib/nomba";
// import { createClient } from "@supabase/supabase-js";
// import bcrypt from "bcryptjs";

// export async function POST(req: Request) {
//   const supabase = createClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!
//   );

//   try {
//     const {
//       userId,
//       senderName,
//       amount,
//       accountNumber,
//       accountName,
//       bankCode,
//       narration,
//       pin,
//     } = await req.json();

//     // Basic validation
//     if (
//       !userId ||
//       !pin ||
//       !amount ||
//       amount < 100 ||
//       !accountNumber ||
//       !accountName ||
//       !bankCode
//     ) {
//       return NextResponse.json(
//         {
//           message: "Missing required fields",
//           requiredFields: [
//             "userId",
//             "amount",
//             "accountNumber",
//             "accountName",
//             "bankCode",
//             "pin",
//           ],
//         },
//         { status: 400 }
//       );
//     }

//     if (typeof amount !== "number" || amount <= 0) {
//       return NextResponse.json(
//         { message: "Amount must be a valid number greater than 0" },
//         { status: 400 }
//       );
//     }

//     if (typeof accountNumber !== "string" || accountNumber.length < 6) {
//       return NextResponse.json(
//         { message: "Account number must be a valid string" },
//         { status: 400 }
//       );
//     }

//     // Fetch user with PIN + wallet balance
//     const { data: user, error: userError } = await supabase
//       .from("users")
//       .select("id, transaction_pin, wallet_balance")
//       .eq("id", userId)
//       .single();

//     if (userError || !user) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     // ✅ Verify transaction PIN
//     const plainPin = Array.isArray(pin) ? pin.join("") : pin;
//     const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
//     if (!isValid) {
//       return NextResponse.json(
//         { message: "Invalid transaction PIN" },
//         { status: 401 }
//       );
//     }



//     if (user.wallet_balance < amount) {
//       return NextResponse.json(
//         { message: "Insufficient wallet balance (including fees)" },
//         { status: 400 }
//       );
//     }

//     // Get Nomba token
//     const token = await getNombaToken();
//     if (!token) {
//       return NextResponse.json(
//         { message: "Unauthorized: Nomba token missing" },
//         { status: 401 }
//       );
//     }

//     const merchantTxRef = `WD_${Date.now()}`;

//     // Insert pending withdrawal transaction
//     const { data: pendingTx, error: txError } = await supabase
//       .from("transactions")
//       .insert({
//         user_id: userId,
//         type: "withdrawal",
//         amount,
//         total_deduction: amount,
//         status: "pending",
//         description: `Withdrawal to ${accountName} (${accountNumber})`,
//         narration: narration || "Withdrawal",
//         merchant_tx_ref: merchantTxRef,
//       })
//       .select("*")
//       .single();

//     if (txError || !pendingTx) {
//       console.error("Could not create transaction record:", txError);
//       return NextResponse.json(
//         { error: "Could not create transaction record" },
//         { status: 500 }
//       );
//     }

//     // Send transfer to Nomba
//     const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         accountId: process.env.NOMBA_ACCOUNT_ID!,
//       },
//       body: JSON.stringify({
//         amount,
//         accountNumber,
//         accountName,
//         bankCode,
//         senderName,
//         merchantTxRef,
//         narration: "Withdrawal",
//       }),
//     });

//     const data = await res.json();

//     console.log("transfer data", data)

//     // Save Nomba response and set status to processing
//     await supabase
//       .from("transactions")
//       .update({
//         external_response: JSON.stringify(data || {}),
//         status: "success",
//         reference: data?.data?.reference || null,
//       })
//       .eq("id", pendingTx.id);


//     return NextResponse.json({
//       message: "Withdrawal initiated (processing). Waiting for webhook confirmation.",
//       merchantTxRef,
//       transactionId: pendingTx.id,
//       nombaResponse: data,
//     });
//   } catch (error: any) {
//     console.error("Withdraw API error:", error);
//     return NextResponse.json(
//       { error: "Server error: " + error.message || error.description },
//       { status: 500 }
//     );
//   }
// }



// app/api/withdraw/route.ts
import { NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const {
      userId,
      senderName,
      amount,
      accountNumber,
      accountName,
      bankCode,
      narration,
      pin,
    } = await req.json();

    // Basic validation
    if (!userId || !pin || !amount || amount < 100 || !accountNumber || !accountName || !bankCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verify transaction PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });
    }

    // Check balance
    if (user.wallet_balance < amount) {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    // Get Nomba token with better error handling
    let token;
    try {
      token = await getNombaToken();
      if (!token) {
        throw new Error("Failed to get Nomba token");
      }
    } catch (tokenError) {
      console.error("❌ Nomba token error:", tokenError);
      return NextResponse.json(
        { error: "Authentication failed: Cannot connect to payment processor" },
        { status: 500 }
      );
    }

    // Generate unique reference
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const merchantTxRef = `WD_${timestamp}_${randomSuffix}_${userId.substring(0, 8)}`;

    console.log("🔍 Nomba Configuration Check:");
    console.log("NOMBA_URL:", process.env.NOMBA_URL);
    console.log("NOMBA_ACCOUNT_ID:", process.env.NOMBA_ACCOUNT_ID ? "✅ Set" : "❌ Missing");
    console.log("MerchantTxRef:", merchantTxRef);

    // Create pending transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        amount,
        total_deduction: amount,
        status: "pending",
        description: `Withdrawal to ${accountName} (${accountNumber})`,
        narration: narration || "Withdrawal",
        merchant_tx_ref: merchantTxRef,
        channel: "bank_transfer",
      })
      .select("*")
      .single();

    if (txError || !pendingTx) {
      console.error("❌ Transaction creation failed:", txError);
      return NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
    }

    // Prepare Nomba request payload
    const nombaPayload = {
      amount: Math.round(amount * 100), // Convert to kobo if needed
      accountNumber: accountNumber.toString(),
      accountName: accountName,
      bankCode: bankCode.toString(),
      senderName: senderName || "Customer",
      merchantTxRef: merchantTxRef,
      narration: narration || "Withdrawal",
    };

    console.log("📤 Sending to Nomba:", {
      url: `${process.env.NOMBA_URL}/v1/transfers/bank`,
      payload: nombaPayload
    });

    // Send transfer to Nomba with better error handling
    let nombaResponse;
    try {
      const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          // Add POS ID if required
          ...(process.env.NOMBA_POS_ID && { posId: process.env.NOMBA_POS_ID }),
        },
        body: JSON.stringify(nombaPayload),
      });

      nombaResponse = await res.json();
      console.log("📥 Nomba raw response:", nombaResponse);

    } catch (fetchError) {
      console.error("❌ Network error calling Nomba:", fetchError);
      
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: { error: "Network error", details: fetchError },
          description: "Withdrawal failed: Network error connecting to payment processor",
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { error: "Network error connecting to payment processor" },
        { status: 500 }
      );
    }

    // Handle specific Nomba errors
    if (nombaResponse.code === '404' && nombaResponse.description?.includes('Record not found')) {
      console.error("❌ Nomba 404 - Record not found. Possible issues:");
      console.log("   - Invalid accountId:", process.env.NOMBA_ACCOUNT_ID);
      console.log("   - Invalid POS ID:", process.env.NOMBA_POS_ID);
      console.log("   - Incorrect API endpoint");
      
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: nombaResponse,
          description: "Withdrawal failed: Payment processor configuration error",
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { 
          error: "Payment processor configuration error",
          details: "Please check your Nomba account configuration"
        },
        { status: 500 }
      );
    }

    // Handle other Nomba errors
    if (!nombaResponse.status || nombaResponse.status === false) {
      console.error("❌ Nomba transfer failed:", nombaResponse);
      
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: nombaResponse,
          description: `Withdrawal failed: ${nombaResponse.description || 'Unknown error'}`,
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { 
          error: "Transfer failed",
          details: nombaResponse.description || "Unknown error from payment processor"
        },
        { status: 400 }
      );
    }

    // If successful, update transaction
    await supabase
      .from("transactions")
      .update({
        external_response: nombaResponse,
        status: "processing",
        reference: nombaResponse?.data?.reference || null,
      })
      .eq("id", pendingTx.id);

    // Deduct balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({ 
        wallet_balance: Math.max(0, user.wallet_balance - amount) 
      })
      .eq("id", userId);

    if (balanceError) {
      console.error("❌ Failed to deduct balance:", balanceError);
    }

    return NextResponse.json({
      message: "Withdrawal initiated successfully",
      merchantTxRef,
      transactionId: pendingTx.id,
      status: "processing",
    });
  } catch (error: any) {
    console.error("❌ Withdraw API error:", error);
    return NextResponse.json(
      { error: "Server error: " + error.message },
      { status: 500 }
    );
  }
}