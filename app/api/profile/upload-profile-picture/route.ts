import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const userId = form.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "File or userId missing" }, { status: 400 });
    }

    const bucket = "profile-pictures";
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}-${Date.now()}.${fileExt}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl;

    // Update database user table
    await supabase
      .from("users")
      .update({ profile_picture: publicUrl })
      .eq("id", userId);

    return NextResponse.json({ url: publicUrl }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
