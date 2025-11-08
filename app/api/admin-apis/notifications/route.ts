// app/api/admin/notifications/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendNotificationToUsers({
  title,
  message,
  type,
  target_audience,
  admin_notification_id
}: {
  title: string;
  message: string;
  type: string;
  target_audience: string;
  admin_notification_id: string;
}) {
  try {
    console.log('=== START: sendNotificationToUsers ===');
    console.log('Title:', title);
    console.log('Target audience:', target_audience);
    
    let userQuery = supabase
      .from('users')
      .select('id, email, first_name, last_name');

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
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users for target: ${target_audience}`);

    if (!users || users.length === 0) {
      throw new Error('No users found for the target audience');
    }

    const notifications = users.map(user => ({
      user_id: user.id,
      title,
      message,
      type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log(`Creating ${notifications.length} notifications...`);

    const { data, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('Error creating notifications:', insertError);
      throw insertError;
    }

    console.log(`Successfully created ${data?.length || 0} notifications`);

    await supabase
      .from('admin_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        stats: {
          total_users: users.length,
          successful: data?.length || 0,
          failed: 0,
          users_notified: users.map(u => ({ id: u.id, email: u.email, name: `${u.first_name} ${u.last_name}` }))
        }
      })
      .eq('id', admin_notification_id);

    console.log('=== END: sendNotificationToUsers - SUCCESS ===');
    return {
      success: true,
      total: users.length,
      successful: data?.length || 0,
      failed: 0
    };

  } catch (error) {
    console.error('=== END: sendNotificationToUsers - ERROR ===', error);
    
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      title, 
      message, 
      type = 'info',
      target_audience = 'all_users',
      is_urgent = false
    } = body;

    console.log('=== ADMIN API: Creating notification ===');
    console.log('Title:', title);
    console.log('Target:', target_audience);

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const { data: notification, error: notifError } = await supabase
      .from('admin_notifications')
      .insert({
        title,
        message,
        type,
        target_audience,
        is_urgent,
        status: 'sending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (notifError) {
      console.error('Admin notification creation error:', notifError);
      throw notifError;
    }

    console.log('Created admin notification with ID:', notification.id);

    const sendResult = await sendNotificationToUsers({
      title,
      message,
      type,
      target_audience,
      admin_notification_id: notification.id
    });

    return NextResponse.json({ 
      success: sendResult.success, 
      notification: {
        ...notification,
        status: sendResult.success ? 'sent' : 'failed'
      },
      sendResult,
      message: sendResult.success ? 'Notification sent successfully' : 'Failed to send notification'
    });

  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const range = searchParams.get('range');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (range && range !== 'total') {
      const date = new Date();
      switch (range) {
        case 'today':
          date.setHours(0, 0, 0, 0);
          query = query.gte('created_at', date.toISOString());
          break;
        case 'week':
          date.setDate(date.getDate() - 7);
          query = query.gte('created_at', date.toISOString());
          break;
        case 'month':
          date.setMonth(date.getMonth() - 1);
          query = query.gte('created_at', date.toISOString());
          break;
      }
    }

    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      page,
      limit
    });

  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const { data: existingNotification, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    if (existingNotification.status === 'sent') {
      return NextResponse.json(
        { error: "Cannot delete already sent notifications" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}