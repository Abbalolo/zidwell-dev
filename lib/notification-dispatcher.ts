import { createClient } from "@supabase/supabase-js";
import { sendEmailNotification } from "./admin-email-service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define proper types
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "contract"
  | "wallet"
  | "transaction";
export type NotificationChannel = "in_app" | "email" | "push" | "sms";
export type NotificationPriority = "low" | "normal" | "high";

interface DispatchNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  actionUrl?: string;
  priority?: NotificationPriority;
}

// Type guard functions
function isValidNotificationType(type: string): type is NotificationType {
  return [
    "info",
    "success",
    "warning",
    "error",
    "contract",
    "wallet",
    "transaction",
  ].includes(type);
}

function isValidNotificationChannel(
  channel: string
): channel is NotificationChannel {
  return ["in_app", "email", "push", "sms"].includes(channel);
}

function isValidPriority(priority: string): priority is NotificationPriority {
  return ["low", "normal", "high"].includes(priority);
}

// Safe type conversion functions
function safeNotificationType(type: string): NotificationType {
  return isValidNotificationType(type) ? type : "info";
}

function safeNotificationChannels(channels: string[]): NotificationChannel[] {
  return channels.filter((channel) =>
    isValidNotificationChannel(channel)
  ) as NotificationChannel[];
}

function safePriority(priority: string): NotificationPriority {
  return isValidPriority(priority) ? priority : "normal";
}

export async function dispatchNotification({
  userId,
  title,
  message,
  type = "info",
  channels = ["in_app"],
  actionUrl,
  priority = "normal",
}: DispatchNotificationParams) {
  try {
    // 1. Get user data and preferences
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, notification_preferences")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("User fetch error:", userError);
      throw userError;
    }

    // 2. Check user preferences (use default if not set)
    const preferences = userData.notification_preferences || {
      email: true,
      push: true,
      sms: false,
      in_app: true,
    };

    // Filter channels based on user preferences
    const allowedChannels = channels.filter(
      (channel) => preferences[channel] !== false
    );

    if (allowedChannels.length === 0) {
      console.log("No allowed channels for user:", userId);
      return { success: true, skipped: true };
    }

    // 3. Create notification record (using your existing table structure)
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
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
      console.error("Notification creation error:", notifError);
      throw notifError;
    }

    // 4. Create notification log for user (using your existing table structure)
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        notification_id: notification.id,
        read_at: null,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Notification log error:", logError);
      throw logError;
    }

    // 5. Dispatch to different channels
    const dispatchPromises = [];

    // Email notifications
    if (allowedChannels.includes("email") && userData.email) {
      dispatchPromises.push(
        sendEmailNotification(userData.email, title, {
          title,
          message,
          actionUrl,
        })
      );
    }

    // Push notifications (web push)
    if (allowedChannels.includes("push")) {
      dispatchPromises.push(
        sendPushNotification(userId, { title, message, actionUrl })
      );
    }

    // SMS notifications (optional)
    if (allowedChannels.includes("sms")) {
      dispatchPromises.push(
        sendSMSNotification(userId, `${title}: ${message}`)
      );
    }

    // Wait for all dispatches to complete
    const results = await Promise.allSettled(dispatchPromises);

    // Log results
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Channel ${allowedChannels[index]} failed:`,
          result.reason
        );
      }
    });

    return {
      success: true,
      notificationId: notification.id,
      channels: allowedChannels,
    };
  } catch (error) {
    console.error("Notification dispatch failed:", error);
    return { success: false, error };
  }
}

// Flexible version that accepts strings and converts them safely
export async function dispatchNotificationFlexible({
  userId,
  title,
  message,
  type = "info",
  channels = ["in_app"],
  actionUrl,
  priority = "normal",
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  channels?: string[];
  actionUrl?: string;
  priority?: string;
}) {
  // Convert string types to proper typed values (using function declarations that are hoisted)
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
    priority: safePriorityValue,
  });
}

export async function dispatchBulkNotifications({
  userIds,
  title,
  message,
  type = 'info',
  channels = ['in_app'],
  actionUrl
}: {
  userIds: string[];
  title: string;
  message: string;
  type?: string;
  channels?: string[];
  actionUrl?: string;
}) {
  try {
    console.log(`Creating notifications for ${userIds.length} users`);

    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        channels,
        action_url: actionUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (notifError) throw notifError;

    const mainChannel = channels?.[0] || 'in_app';
    const now = new Date().toISOString();
    
    const notificationLogs = userIds.map(userId => ({
      notification_id: notification.id,
      user_id: userId,
      channel: mainChannel,
      status: 'sent',
      sent_at: now,
      read_at: null,
      delivered_at: null,
      error_message: null,
      created_at: now,
      updated_at: now, // ← INCLUDED
    }));

    const { error: logsError } = await supabase
      .from('notification_logs')
      .insert(notificationLogs);

    if (logsError) throw logsError;

    console.log(`✅ Created ${notificationLogs.length} notification logs`);

    return {
      success: true,
      total: userIds.length,
      successful: userIds.length,
      failed: 0
    };

  } catch (error) {
    console.error('Bulk notification dispatch failed:', error);
    return { success: false, error, total: userIds.length, successful: 0, failed: userIds.length };
  }
}
// Strict version for when you know the types are correct
export async function dispatchBulkNotificationsStrict({
  userIds,
  title,
  message,
  type = "info",
  channels = ["in_app"],
  actionUrl,
  priority = "normal",
}: {
  userIds: string[];
  title: string;
  message: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  actionUrl?: string;
  priority?: NotificationPriority;
}) {
  try {
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        dispatchNotification({
          userId,
          title,
          message,
          type,
          channels,
          actionUrl,
          priority,
        })
      )
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    const failed = results.filter(
      (result) => result.status === "rejected" || !result.value?.success
    ).length;

    return {
      success: true,
      total: userIds.length,
      successful,
      failed,
    };
  } catch (error) {
    console.error("Bulk notification dispatch failed:", error);
    return { success: false, error };
  }
}

// Push notification function (web push)
async function sendPushNotification(userId: string, data: any) {
  try {
    // Get user's push subscription from database
    const { data: subscription } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .single();

    if (!subscription) {
      console.log("No push subscription found for user:", userId);
      return;
    }

    // Send web push notification
    // You'll need to implement this based on your push service
    console.log("Push notification would be sent to:", userId, data);

    // Example implementation:
    // await fetch('/api/push/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ subscription, data })
    // });
  } catch (error) {
    console.error("Push notification failed:", error);
  }
}

// SMS notification function
async function sendSMSNotification(userId: string, message: string) {
  try {
    // Get user's phone number
    const { data: user } = await supabase
      .from("users")
      .select("phone")
      .eq("id", userId)
      .single();

    if (!user?.phone) {
      console.log("No phone number found for user:", userId);
      return;
    }

    // Implement SMS sending logic (Twilio, etc.)
    console.log("SMS would be sent to:", user.phone, message);

    // Example implementation:
    // await fetch('/api/sms/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ to: user.phone, message })
    // });
  } catch (error) {
    console.error("SMS notification failed:", error);
  }
}
