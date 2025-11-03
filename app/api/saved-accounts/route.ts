import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch saved accounts for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const { data: accounts, error } = await supabase
      .from("saved_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      accounts: accounts || [],
    });
  } catch (error: any) {
    console.error("Get saved accounts error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Save a new account
export async function POST(req: Request) {
  try {
    const { userId, accountNumber, accountName, bankCode, bankName, isDefault = false } = await req.json();

    if (!userId || !accountNumber || !accountName || !bankCode || !bankName) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // If setting as default, remove default from other accounts
    if (isDefault) {
      await supabase
        .from("saved_accounts")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);
    }

    // Insert new saved account
    const { data, error } = await supabase
      .from("saved_accounts")
      .insert([
        {
          user_id: userId,
          account_number: accountNumber,
          account_name: accountName,
          bank_code: bankCode,
          bank_name: bankName,
          is_default: isDefault,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "This account is already saved" },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Account saved successfully",
      account: data,
    });
  } catch (error: any) {
    console.error("Save account error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}