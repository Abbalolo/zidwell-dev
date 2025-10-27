// app/api/support/tickets/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: User's tickets - Get user_id from query parameters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { data: tickets, error } = await supabase
      .from("dispute_tickets")
      .select(`
        *,
        messages:dispute_messages(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedTickets = tickets?.map(ticket => ({
      ...ticket,
      message_count: ticket.messages?.[0]?.count || 0
    })) || [];

    return NextResponse.json(formattedTickets);
  } catch (err: any) {
 
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create new ticket - Get user_id from form data
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const subject = formData.get('subject') as string;
    const category = formData.get('category') as string;
    const priority = formData.get('priority') as string;
    const description = formData.get('description') as string;
    const userId = formData.get('user_id') as string;
    const userEmail = formData.get('user_email') as string;

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 });
    }

    // Generate unique ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: ticket, error } = await supabase
      .from("dispute_tickets")
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        user_email: userEmail,
        subject,
        category,
        priority,
        description,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
     
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Handle file uploads here (you'd need to implement Supabase Storage)

    return NextResponse.json(ticket);
  } catch (err: any) {

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}