import { NextResponse } from "next/server";
import { dbAdmin } from "@/app/firebase/firebaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

  const doc = await dbAdmin.collection("contracts").doc(id).get();
  if (!doc.exists) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json({ contract: { id: doc.id, ...doc.data() } });
}
