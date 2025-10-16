// pages/api/profile/upload-cac.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const cacFile = formData.get("cacFile") as File | null;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!cacFile) {
      return NextResponse.json({ error: "No CAC file uploaded" }, { status: 400 });
    }

    // Upload CAC file
    const { data, error: uploadError } = await supabase.storage
      .from("kyc-files") 
      .upload(`cac/${userId}-${cacFile.name}`, cacFile, {
        upsert: true,
        contentType: cacFile.type,
      });

    if (uploadError) throw uploadError;

    // Generate public URL
    const { data: publicData } = supabase.storage
      .from("kyc-files")
      .getPublicUrl(data.path);

    const cacUrl = publicData.publicUrl;

    // Optional: Save the URL in the business table
    const { error: dbError } = await supabase
      .from("businesses")
      .update({ cac_file_url: cacUrl, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, cacUrl });
  } catch (error: any) {
    console.error("CAC upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload CAC", details: error.message },
      { status: 500 }
    );
  }
}
