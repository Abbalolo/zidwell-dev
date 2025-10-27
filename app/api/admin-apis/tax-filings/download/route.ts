// app/api/admin-apis/tax-filings/download/route.ts
import JSZip from "jszip";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Fetch the file URLs for the given filing
    const { data: filingData, error } = await supabaseAdmin
      .from("tax_filings")
      .select("address_proof_url, id_card_url, bank_statement_url")
      .eq("id", id)
      .single();

    if (error || !filingData) {
      console.error("❌ Error fetching filing:", error);
      return NextResponse.json({ error: "Filing not found" }, { status: 404 });
    }

    // Build the list of files
    const fileUrls = [
      filingData.address_proof_url,
      filingData.id_card_url,
      filingData.bank_statement_url,
    ].filter(Boolean);

    if (fileUrls.length === 0) {
      return NextResponse.json({ error: "No files to download" }, { status: 404 });
    }

    // Create ZIP
    const zip = new JSZip();

    for (const fileUrl of fileUrls) {
      if (!fileUrl) continue;

      try {
        // Extract the file path from the URL
        // Supabase storage URLs typically look like: 
        // https://project-ref.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        
        // Find the index after 'object' to get the actual file path
        const objectIndex = pathParts.indexOf('object');
        if (objectIndex === -1) {
          console.error("⚠️ Invalid Supabase URL format:", fileUrl);
          continue;
        }

        // The path should be everything after '/public/bucket-name/'
        // Join parts from objectIndex + 3 to skip '/object/public/bucket-name'
        const filePath = pathParts.slice(objectIndex + 3).join('/');
        
        if (!filePath) {
          console.error("⚠️ Could not extract file path from URL:", fileUrl);
          continue;
        }

        console.log("📥 Downloading file from path:", filePath);

        const { data, error } = await supabaseAdmin.storage
          .from("tax_doc")
          .download(filePath);

        if (error || !data) {
          console.error("⚠️ Failed to download file:", filePath, error?.message);
          continue;
        }

        const arrayBuffer = await data.arrayBuffer();
        const fileName = filePath.split("/").pop() || `file-${Date.now()}`;
        zip.file(fileName, arrayBuffer);
        console.log("✅ Added to ZIP:", fileName);

      } catch (fileError) {
        console.error("⚠️ Error processing file URL:", fileUrl, fileError);
        continue;
      }
    }

    // Check if any files were added to the ZIP
    const filesCount = Object.keys(zip.files).length;
    if (filesCount === 0) {
      return NextResponse.json({ error: "No files could be downloaded" }, { status: 404 });
    }

    console.log(`📦 Generating ZIP with ${filesCount} files`);

    // Generate ZIP
    const zipBuffer:any = await zip.generateAsync({ 
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="tax-files-${id}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error creating ZIP:", error);
    return NextResponse.json({ error: "Failed to create ZIP" }, { status: 500 });
  }
}