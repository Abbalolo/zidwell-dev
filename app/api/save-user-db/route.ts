import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const token = await getNombaToken();
    const body = await req.json();

    const {
      userId,
      dateOfBirth,
      businessName,
      role,
      businessAddress,
      businessCategory,
      businessDescription,
      taxId,
      registrationNumber,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const { data: pendingUser, error: pendingError } = await supabase
      .from("pending_users")
      .select("*")
      .eq("auth_id", userId)
      .eq("bvn_verification", "verified")
      .single();

    if (pendingError) {
      console.error("❌ Fetch pending error:", pendingError);
      return NextResponse.json(
        { error: "Error fetching pending user" },
        { status: 500 }
      );
    }

    if (!pendingUser) {
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
          wallet_balance: 0,
          zidcoin_balance: 20,
          referral_code: generatedReferral,
          referred_by: referred_by || null,
          bvn_verification: "verified",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (userError) {
      console.error("❌ Upsert user error:", userError);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    const { error: businessError } = await supabase.from("businesses").upsert(
      {
        user_id: auth_id,
        business_name: businessName,
        role,
        business_address: businessAddress,
        business_category: businessCategory,
        business_description: businessDescription,
        tax_id: taxId,
        registration_number: registrationNumber,
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

    // 3️⃣ Apply referral rewards (if referred_by exists)
    if (referred_by) {
      const { error: refError } = await supabase.rpc("add_zidcoin", {
        ref_code: referred_by,
        amount: 10,
      });

      if (refError) {
        console.error("❌ Referral RPC error:", refError);
      } else {
        // Add bonus for referred user
        await supabase
          .from("users")
          .update({ zidcoin_balance: userData.zidcoin_balance + 5 })
          .eq("id", auth_id);
      }
    }

    // 4️⃣ Create wallet in Nomba
    if (!token) {
      return NextResponse.json(
        { error: "Failed to get Nomba token" },
        { status: 500 }
      );
    }

    const fullName = `${first_name} ${last_name}`;
    const nombaRes = await fetch(
      "https://sandbox.nomba.com/v1/accounts/virtual",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountName: fullName,
          accountRef: auth_id,
        }),
      }
    );

    const wallet = await nombaRes.json();

    console.log("Nomba Response:", wallet);

    if (!nombaRes.ok || !wallet?.data) {
      console.error("❌ Nomba wallet error:", wallet);
      return NextResponse.json(
        { error: wallet.message || "Failed to create wallet" },
        { status: nombaRes.status }
      );
    }

    // 5️⃣ Store wallet details
    const { error: walletError } = await supabase
      .from("users")
      .update({
        bank_name: wallet.data.bankName,
        bank_account_name: wallet.data.bankAccountName,
        bank_account_number: wallet.data.bankAccountNumber,
        wallet_id: wallet.data.accountHolderId,
      })
      .eq("id", auth_id);

    console.log("walletError", walletError);
    if (walletError) {
      console.error("❌ Wallet update error:", walletError);
      return NextResponse.json(
        { error: "Failed to update wallet info" },
        { status: 500 }
      );
    }

    await supabase.from("pending_users").delete().eq("auth_id", auth_id);

    // 7️⃣ Send welcome email (non-blocking)
    (async () => {
      try {
        const baseUrl =
          process.env.NODE_ENV === "development"
            ? process.env.NEXT_PUBLIC_DEV_URL
            : process.env.NEXT_PUBLIC_BASE_URL;

        const htmlContent = `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 40px;">
            <div style="max-width: 700px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <div style="background: #C29307; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0;">Welcome to Zidwell 🎉</h2>
              </div>
              <div style="padding: 30px; color: #333;">
                <h2 style="margin-top: 0;">Hi ${first_name},</h2>
                <p>🎉 <b>Congratulations!</b> Your <span style="color: #C29307; font-weight: bold;">Zidwell</span> account is ready.</p>
                <p>We’ve rewarded you with <span style="color: #C29307; font-weight: bold;">₦20 Zidcoin</span> 🎁.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/dashboard" style="background: #C29307; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">🚀 Go to Dashboard</a>
                </div>
              </div>
              <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                &copy; ${new Date().getFullYear()} Zidwell. All rights reserved.
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Zidwell" <${process.env.EMAIL_USER!}>`,
          to: email,
          subject: "🎉 Congratulations & Welcome to Zidwell!",
          html: htmlContent,
        });
      } catch (mailError) {
        console.error("❌ Email error:", mailError);
      }
    })();

    // 8️⃣ Return final user + wallet info
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
