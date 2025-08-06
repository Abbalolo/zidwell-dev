import { NextResponse } from "next/server";
import { dbAdmin } from "@/app/firebase/firebaseAdmin";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

  await dbAdmin.collection("contracts").doc(data.id).update({
    contractTitle: data.contractTitle,
    contractText: data.contractText,
    description: data.description || "",
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ message: "Updated successfully" });
}
