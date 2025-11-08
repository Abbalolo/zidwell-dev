// app/api/notifications/read-all/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    const { error, count } = await supabase
      .from('notifications')
      .update({ 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Marked ${count} notifications as read`
    });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}