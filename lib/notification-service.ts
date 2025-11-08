// lib/notification-service.ts
import { createClient } from '@supabase/supabase-js';
import { sendEmailNotification } from '@/lib/admin-email-service'; 

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define proper types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'contract' | 'wallet' | 'transaction';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';
export type NotificationPriority = 'low' | 'normal' | 'high';

// Default notification preferences
const DEFAULT_PREFERENCES = {
  email: true,
  push: true,
  sms: false,
  in_app: true
};

// Type guard functions
function isValidNotificationType(type: string): type is NotificationType {
  return ['info', 'success', 'warning', 'error', 'contract', 'wallet', 'transaction'].includes(type);
}

function isValidNotificationChannel(channel: string): channel is NotificationChannel {
  return ['in_app', 'email', 'push', 'sms'].includes(channel);
}

function isValidPriority(priority: string): priority is NotificationPriority {
  return ['low', 'normal', 'high'].includes(priority);
}

// Safe type conversion functions
function safeNotificationType(type: string): NotificationType {
  return isValidNotificationType(type) ? type : 'info';
}

function safeNotificationChannels(channels: string[]): NotificationChannel[] {
  return channels.filter(channel => isValidNotificationChannel(channel)) as NotificationChannel[];
}

function safePriority(priority: string): NotificationPriority {
  return isValidPriority(priority) ? priority : 'normal';
}

// Helper function to get user preferences safely
async function getUserPreferences(userId: string): Promise<typeof DEFAULT_PREFERENCES> {
  try {
    // Try to get user with notification_preferences
    const { data: userData, error } = await supabase
      .from('users')
      .select('email, notification_preferences')
      .eq('id', userId)
      .single();

    if (error) {
      // If column doesn't exist, use default preferences
      if (error.code === '42703') { // undefined_column error code
        console.log('Notification preferences column not found, using defaults for user:', userId);
        
        // Just get the email
        const { data: userEmail } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();

        return {
          ...DEFAULT_PREFERENCES,
          email: userEmail?.email ? true : false
        };
      }
      throw error;
    }

    // Use user preferences or defaults
    return {
      ...DEFAULT_PREFERENCES,
      ...(userData.notification_preferences || {})
    };

  } catch (error) {
    console.error('Error getting user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

interface DispatchNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  actionUrl?: string;
  priority?: NotificationPriority;
}

export async function dispatchNotification({
  userId,
  title,
  message,
  type = 'info',
  channels = ['in_app'],
  actionUrl,
  priority = 'normal'
}: DispatchNotificationParams) {
  try {
    // 1. Get user preferences safely
    const preferences = await getUserPreferences(userId);

    // 2. Filter channels based on user preferences
    const allowedChannels = channels.filter(channel => preferences[channel] !== false);

    if (allowedChannels.length === 0) {
      console.log('No allowed channels for user:', userId);
      return { success: true, skipped: true };
    }

    // 3. Create notification record
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        channels: allowedChannels,
        action_url: actionUrl,
        priority,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (notifError) {
      console.error('Notification creation error:', notifError);
      throw notifError;
    }

    // 4. Create notification log for user
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_id: notification.id,
        read_at: null,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Notification log error:', logError);
      throw logError;
    }

    // 5. Get user email for notifications
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // 6. Dispatch to different channels
    const dispatchPromises = [];

    // Email notifications
    if (allowedChannels.includes('email') && userData?.email) {
      dispatchPromises.push(
        sendEmailNotification(
          userData.email, 
          title, 
          { title, message, actionUrl }
        )
      );
    }

    // Push notifications (web push)
    if (allowedChannels.includes('push')) {
      dispatchPromises.push(
        sendPushNotification(userId, { title, message, actionUrl })
      );
    }

    // SMS notifications (optional)
    if (allowedChannels.includes('sms')) {
      dispatchPromises.push(
        sendSMSNotification(userId, `${title}: ${message}`)
      );
    }

    // Wait for all dispatches to complete
    const results = await Promise.allSettled(dispatchPromises);
    
    // Log results
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Channel ${allowedChannels[index]} failed:`, result.reason);
      }
    });

    return { 
      success: true, 
      notificationId: notification.id,
      channels: allowedChannels
    };

  } catch (error) {
    console.error('Notification dispatch failed:', error);
    return { success: false, error };
  }
}

// Flexible version that accepts strings and converts them safely
export async function dispatchNotificationFlexible({
  userId,
  title,
  message,
  type = 'info',
  channels = ['in_app'],
  actionUrl,
  priority = 'normal'
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  channels?: string[];
  actionUrl?: string;
  priority?: string;
}) {
  // Convert string types to proper typed values
  const safeType = safeNotificationType(type);
  const safeChannels = safeNotificationChannels(channels);
  const safePriorityValue = safePriority(priority);

  return dispatchNotification({
    userId,
    title,
    message,
    type: safeType,
    channels: safeChannels,
    actionUrl,
    priority: safePriorityValue
  });
}

// Function to send notifications to multiple users (flexible version)
export async function dispatchBulkNotifications({
  userIds,
  title,
  message,
  type = 'info',
  channels = ['in_app'],
  actionUrl,
  priority = 'normal'
}: {
  userIds: string[];
  title: string;
  message: string;
  type?: string;
  channels?: string[];
  actionUrl?: string;
  priority?: string;
}) {
  try {
    const results = await Promise.allSettled(
      userIds.map(userId => 
        dispatchNotificationFlexible({
          userId,
          title,
          message,
          type,
          channels,
          actionUrl,
          priority
        })
      )
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.filter(result => 
      result.status === 'rejected' || !result.value?.success
    ).length;

    return {
      success: true,
      total: userIds.length,
      successful,
      failed
    };

  } catch (error) {
    console.error('Bulk notification dispatch failed:', error);
    return { success: false, error };
  }
}

// Push notification function (web push)
async function sendPushNotification(userId: string, data: any) {
  try {
    // Check if push_subscriptions table exists
    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (!subscription) {
      console.log('No push subscription found for user:', userId);
      return;
    }

    console.log('Push notification would be sent to:', userId, data);
    
  } catch (error: any) {
    // If table doesn't exist, just log and continue
    if (error.code === '42P01') { // undefined_table error code
      console.log('Push subscriptions table not found, skipping push notification');
    } else {
      console.error('Push notification failed:', error);
    }
  }
}

// SMS notification function
async function sendSMSNotification(userId: string, message: string) {
  try {
    // Get user's phone number
    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();

    if (!user?.phone) {
      console.log('No phone number found for user:', userId);
      return;
    }

    console.log('SMS would be sent to:', user.phone, message);
    
  } catch (error) {
    console.error('SMS notification failed:', error);
  }
}