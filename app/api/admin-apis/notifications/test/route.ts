// app/api/notifications/test/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userData } = body;

    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a test notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        title: "Test Notification",
        message: "This is a test notification from the system",
        type: "info",
        channels: ["in_app"],
        target_audience: "specific_user",
        status: "sent"
      })
      .select()
      .single();

    if (notifError) {
      return NextResponse.json({ error: notifError.message }, { status: 500 });
    }

    // Create notification log for the user
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        notification_id: notification.id,
        user_id: userData.id,
        channel: "in_app",
        status: "sent"
      });

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Test notification created successfully",
      notification 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}