import { dbAdmin } from "@/app/firebase/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      email,
      firstName,
      lastName,
      phone,
      walletId,
      bankAccountName,
      bankAccountNumber,
      bankCode,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const docId = email.toLowerCase();

    await dbAdmin.collection("users").doc(docId).set(
      {
        email,
        firstName,
        lastName,
        phone,
        walletId,
        bankAccountName,
        bankAccountNumber,
        bankCode,
        // zidCoin: 30,
        // subscription: "inActive",
        loginAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Firestore Error:", error);

    if (error.response?.data) {
      return NextResponse.json(error.response.data, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to save user to Firestore" },
      { status: 500 }
    );
  }
}
