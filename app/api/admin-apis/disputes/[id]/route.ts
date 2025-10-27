// app/api/admin-apis/disputes/[id]/route.ts
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
  try {
    const { id } = params;

    // Get ticket with messages and attachments
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (err: any) {
    console.error("Server error (dispute detail):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}