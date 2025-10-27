// app/api/admin-apis/disputes/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    // ✅ Optionally check authentication cookie
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get dispute ticket with nested messages + attachments
    const { data: ticket, error } = await supabaseAdmin
      .from("dispute_tickets")
      .select(`
        *,
        messages:dispute_messages(
          *,
          attachments:dispute_attachments(*)
        ),
        attachments:dispute_attachments(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching dispute:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // ✅ Return full ticket data with messages & attachments
    return NextResponse.json(ticket);
  } catch (err: any) {
    console.error("Server error (dispute detail):", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
