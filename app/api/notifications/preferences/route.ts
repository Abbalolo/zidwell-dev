// app/api/notifications/preferences/route.ts
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

    const { data: preferences, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userData.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      in_app_notifications: true,
      contract_updates: true,
      wallet_alerts: true,
      transaction_alerts: true,
      marketing_emails: false
    };

    return NextResponse.json(preferences || defaultPreferences);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userData, ...updates } = body;

    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from("user_notification_preferences")
      .upsert({
        user_id: userData.id,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(preferences);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}