// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define types for better TypeScript support
interface NotificationLog {
  id: string;
  read_at: string | null;
  created_at: string;
  notification: Array<{
    title: string;
    message: string;
    type: string;
    channels: string[];
    created_at: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userData, limit, filter } = body;

    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Fetching notifications for user:', userData.id);

    let query = supabase
      .from("notification_logs")
      .select(`
        id,
        read_at,
        created_at,
        notification:notifications(
          title,
          message,
          type,
          channels,
          created_at
        )
      `)
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filter === 'unread') {
      query = query.is("read_at", null);
    } else if (filter && filter !== 'all') {
      query = query.eq("notification.type", filter);
    }

    // Apply limit
    if (limit) {
      query = query.limit(Number(limit));
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format response - handle cases where notification might be an array
    const notifications = (logs as NotificationLog[])?.map(log => {
      // Get the first notification from the array (should only be one)
      const firstNotification = log.notification?.[0];
      
      return {
        id: log.id,
        title: firstNotification?.title || 'Notification',
        message: firstNotification?.message || 'No message',
        type: firstNotification?.type || 'info',
        channels: firstNotification?.channels || ['in_app'],
        read_at: log.read_at,
        created_at: firstNotification?.created_at || log.created_at
      };
    }).filter(notification => notification.title !== 'Notification') || [];

    console.log(`Found ${notifications.length} notifications for user ${userData.id}`);

    return NextResponse.json(notifications);
  } catch (err: any) {
    console.error('Server error in notifications API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}