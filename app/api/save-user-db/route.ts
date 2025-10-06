import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import { transporter } from "@/lib/node-mailer";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { error: "Failed to authenticate with Nomba" },
        { status: 401 }
      );
    }

  

    const body = await req.json();
    const {
      bvn,
      userId,
      dateOfBirth,
      transactionPin,
      businessName,
      role,
      businessAddress,
      businessCategory,
      businessDescription,
      taxId,
      registrationNumber,
      bankName,
      bankCode,
      bankAccountNumber,
      bankAccountName,

    } = body;

    // ✅ 1. Validate required fields early
    if (!userId || !transactionPin) {
      return NextResponse.json(
        { error: "User ID and transaction PIN are required" },
        { status: 400 }
      );
    }

    // ✅ 2. Validate PIN length & digits
    if (!/^\d{4}$/.test(transactionPin)) {
      return NextResponse.json(
        { error: "Transaction PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    // ✅ 3. Ensure pending user & BVN verified
    const { data: pendingUser, error: pendingError } = await supabase
      .from("pending_users")
      .select("*")
      .eq("id", userId)
      .eq("bvn_verification", "verified")
      .single();

    if (pendingError || !pendingUser) {
      return NextResponse.json(
        { error: "Pending user not found or BVN not verified" },
        { status: 403 }
      );
    }

    const { auth_id, email, first_name, last_name, phone, referred_by } =
      pendingUser;

    const generatedReferral = `${first_name.toLowerCase()}-${Date.now().toString(
      36
    )}`;
    const hashedPin = await bcrypt.hash(transactionPin, 10);

    // ✅ 4. Upsert user profile
    const { data: userData, error: userError } = await supabase
      .from("users")
      .upsert(
        {
          id: auth_id,
          email: email.toLowerCase(),
          first_name,
          last_name,
          phone,
          date_of_birth: dateOfBirth,
          transaction_pin: hashedPin,
          pin_set: true,
          wallet_balance: 0,
          zidcoin_balance: 20,
          referral_code: generatedReferral,
          referred_by: referred_by || "",
          bvn_verification: "verified",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (userError) {
      console.error("❌ Upsert user error:", userError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // ✅ 5. Save business info
    const { error: businessError } = await supabase.from("businesses").upsert(
      {
        user_id: auth_id,
        business_name: businessName || "",
        role: role || "",
        business_address: businessAddress || "",
        business_category: businessCategory || "",
        business_description: businessDescription || "",
        tax_id: taxId || "",
        registration_number: registrationNumber || "",
        bank_name: bankName || "",
        bank_code: bankCode || "",
        bank_account_number: bankAccountNumber || "",
        bank_account_name: bankAccountName || "",
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (businessError) {
      console.error("❌ Business insert error:", businessError);
      return NextResponse.json(
        { error: "Failed to save business info" },
        { status: 500 }
      );
    }

    // ✅ 6. Referral reward handling
    if (referred_by) {
      const { error: refError } = await supabase.rpc("add_zidcoin", {
        ref_code: referred_by,
        amount: 10,
      });

      if (!refError) {
        await supabase
          .from("users")
          .update({ zidcoin_balance: userData.zidcoin_balance + 5 })
          .eq("id", auth_id);
      } else {
        console.error("❌ Referral RPC error:", refError);
      }
    }

    // ✅ 7. Create virtual wallet with Nomba
    const nombaRes = await fetch(
      `${process.env.NOMBA_URL}/v1/accounts/virtual`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountName: `${first_name} ${last_name}`,
          accountRef: auth_id,
          bvn: bvn || undefined,
        }),
      }
    );

    const wallet = await nombaRes.json();

    console.log("💡 Nomba wallet response:", wallet);

    if (!nombaRes.ok || !wallet?.data) {
      console.error("❌ Nomba wallet error:", wallet);
      return NextResponse.json(
        { error: wallet.message || "Failed to create wallet" },
        { status: nombaRes.status }
      );
    }

    // ✅ 8. Save wallet info
    const { error: walletError } = await supabase
      .from("users")
      .update({
        bank_name: wallet.data.bankName,
        bank_account_name: wallet.data.bankAccountName,
        bank_account_number: wallet.data.bankAccountNumber,
        wallet_id: wallet.data.accountRef,
      })
      .eq("id", auth_id);

    if (walletError) {
      console.error("❌ Wallet update error:", walletError);
      return NextResponse.json(
        { error: "Failed to update wallet info" },
        { status: 500 }
      );
    }

    // ✅ 9. Delete pending record
    await supabase.from("pending_users").delete().eq("id", userId);


    // ✅ 10. Send welcome email (non-blocking)
    (async () => {
      try {
        const baseUrl =
          process.env.NODE_ENV === "development"
            ? process.env.NEXT_PUBLIC_DEV_URL
            : process.env.NEXT_PUBLIC_BASE_URL;

        await transporter.sendMail({
          from: `"Zidwell" <${process.env.EMAIL_USER!}>`,
          to: email,
          subject: "🎉 Congratulations & Welcome to Zidwell!",
          html: `
            <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 40px;">
              <div style="max-width: 700px; margin: auto; background: white; border-radius: 10px;">
                <div style="background: #C29307; padding: 20px; text-align: center;">
                  <h2 style="color: white;">Welcome to Zidwell 🎉</h2>
                </div>
                <div style="padding: 30px; color: #333;">
                  <h2>Hi ${first_name},</h2>
                  <p>🎉 <b>Congratulations!</b> Your <b>Zidwell</b> account is ready.</p>
                  <p>We’ve rewarded you with <b>₦20 Zidcoin</b> 🎁.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/dashboard" style="background: #C29307; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none;">🚀 Go to Dashboard</a>
                  </div>
                </div>
                <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                  &copy; ${new Date().getFullYear()} Zidwell. All rights reserved.
                </div>
              </div>
            </div>
          `,
        });
      } catch (mailError) {
        console.error("❌ Email error:", mailError);
      }
    })();

    return NextResponse.json(
      { success: true, user: { ...userData, ...wallet.data } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Unexpected Error:", error);
    return NextResponse.json(
      { error: "Failed to save user and create wallet" },
      { status: 500 }
    );
  }
}
