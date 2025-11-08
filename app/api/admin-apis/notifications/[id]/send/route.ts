import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Send notification to users
async function sendNotificationToUsers({
  title,
  message,
  type,
  channels,
  target_audience,
  admin_notification_id
}: {
  title: string;
  message: string;
  type: string;
  channels: string[];
  target_audience: string;
  admin_notification_id: string;
}) {
  try {
    console.log('=== START: sendNotificationToUsers ===');
    console.log('Title:', title);
    console.log('Target audience:', target_audience);
    console.log('Channels:', channels);
    
    // Get target users based on audience - only select id and email
    let userQuery = supabase
      .from('users')
      .select('id, email'); // Only select columns that exist

    switch (target_audience) {
      case 'premium_users':
        userQuery = userQuery.eq('subscription_tier', 'premium');
        break;
      case 'new_users':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        userQuery = userQuery.gte('created_at', thirtyDaysAgo.toISOString());
        break;
      case 'inactive_users':
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        userQuery = userQuery.lt('last_login', twoWeeksAgo.toISOString());
        break;
      // 'all_users' - no filter
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users for target: ${target_audience}`);

    if (!users || users.length === 0) {
      console.log('No users found for this target audience');
      throw new Error('No users found for the target audience');
    }

    const userIds = users.map(user => user.id);
    console.log('User IDs to notify:', userIds);

    // Send to each user
    const { dispatchBulkNotifications } = await import('@/lib/notification-dispatcher');
    const result = await dispatchBulkNotifications({
      userIds,
      title,
      message,
      type,
      channels
    });

    console.log('Bulk notification result:', result);

    // Update admin notification status
    await supabase
      .from('admin_notifications')
      .update({
        status: result.success ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        stats: {
          total_users: users.length,
          successful: result.successful,
          failed: result.failed,
          in_app_sent: channels.includes('in_app') ? result.successful : 0,
          email_sent: channels.includes('email') ? result.successful : 0,
          sms_sent: channels.includes('sms') ? result.successful : 0,
          push_sent: channels.includes('push') ? result.successful : 0,
        }
      })
      .eq('id', admin_notification_id);

    console.log('=== END: sendNotificationToUsers - SUCCESS ===');
    return {
      success: result.success,
      total: users.length,
      successful: result.successful,
      failed: result.failed
    };

  } catch (error) {
    console.error('=== END: sendNotificationToUsers - ERROR ===', error);
    
    // Mark as failed
    await supabase
      .from('admin_notifications')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sent_at: new Date().toISOString()
      })
      .eq('id', admin_notification_id);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Correct the function signature for Next.js 13+ App Router
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get the ID from params
     const params = await context.params;
  
    const notificationId = params.id;

    console.log('=== SEND API: Sending notification with ID ===', notificationId);

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationId)) {
      return NextResponse.json(
        { error: "Invalid notification ID format" },
        { status: 400 }
      );
    }

    // Get the notification
    const { data: notification, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      console.error('Fetch notification error:', fetchError);
      throw fetchError;
    }

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.status === 'sent') {
      return NextResponse.json(
        { error: "Notification already sent" },
        { status: 400 }
      );
    }

    console.log('Found notification:', notification.title);

    // Send to users
    const result = await sendNotificationToUsers({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      channels: notification.channels,
      target_audience: notification.target_audience,
      admin_notification_id: notification.id
    });

    // Return response
    return NextResponse.json({
      success: result.success,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      message: result.success ? 'Notification sent successfully' : 'Failed to send notification'
    });

  } catch (error: any) {
    console.error('Send now error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}