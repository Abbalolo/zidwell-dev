// app/api/admin/contracts/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id  = (await params).id;

  try {
    // Check for Supabase session cookie
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch contract
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Fetch related audit logs
    const { data: auditLogs, error: auditError } = await supabaseAdmin
      .from("contract_audit_logs")
      .select("*")
      .eq("contract_id", id)
      .order("created_at", { ascending: false });

    if (auditError) console.error("Audit log fetch error:", auditError);

    return NextResponse.json({
      contract,
      auditLogs: auditLogs || [],
    });
  } catch (error) {
    console.error("Contract detail error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
