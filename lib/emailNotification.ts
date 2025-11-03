interface NotificationPayload {
  type: 'login' | 'debit' | 'credit' | 'alert';
  user: {
    email: string;
    full_name: string;
    account_number?: string;
  };
  transaction?: {
    amount: number;
    type: string;
    description: string;
    reference: string;
    balance_after?: number;
    recipient_name?: string;
    recipient_account?: string;
    recipient_bank?: string;
    sender_name?: string;
    sender_account?: string;
  };
  device?: {
    browser?: string;
    os?: string;
    ip_address?: string;
    location?: string;
  };
}


 const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;


export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(`/api/email-alert-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to send notification:', await response.text());
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

// Helper functions for specific notification types
export const notificationService = {
  // Login notifications
  async sendLoginNotification(user: any, deviceInfo: any) {
    return await sendEmailNotification({
      type: 'login',
      user,
      device: deviceInfo,
    });
  },

  // Debit notifications (transfers, bill payments, etc.)
  async sendDebitNotification(user: any, transaction: any) {
    return await sendEmailNotification({
      type: 'debit',
      user,
      transaction,
    });
  },

  // Credit notifications (incoming transfers, deposits, etc.)
  async sendCreditNotification(user: any, transaction: any) {
    return await sendEmailNotification({
      type: 'credit',
      user,
      transaction,
    });
  },

  // General alerts
  async sendAlertNotification(user: any, description: string, additionalData?: any) {
    return await sendEmailNotification({
      type: 'alert',
      user,
      transaction: {
        amount: additionalData?.amount || 0,
        type: 'alert',
        description,
        reference: additionalData?.reference || `ALERT-${Date.now()}`,
        ...additionalData,
      },
    });
  },
};