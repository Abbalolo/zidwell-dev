// app/api/admin-apis/disputes/messages/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const ticket_id = formData.get('ticket_id') as string;
    const message = formData.get('message') as string;
    const sender_type = formData.get('sender_type') as string;
    const attachments = formData.getAll('attachments') as File[];

    if (!ticket_id || !message) {
      return NextResponse.json(
        { error: "Ticket ID and message are required" },
        { status: 400 }
      );
    }

    // Create message
    const { data: messageData, error: messageError } = await supabaseAdmin
      .from("dispute_messages")
      .insert({
        ticket_id,
        message,
        sender_type,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    // Handle attachments (you would need to upload to storage and save references)
    // This is a simplified version - you'd need to implement file upload to Supabase Storage

    // Update ticket's updated_at timestamp
    await supabaseAdmin
      .from("dispute_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticket_id);

    return NextResponse.json({ 
      message: "Message sent successfully", 
      data: messageData 
    });
  } catch (err: any) {
    console.error("Server error (disputes messages):", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}