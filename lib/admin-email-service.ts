import { transporter } from "./node-mailer";

 const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

export async function sendEmailNotification(
  to: string,
  subject: string,
  templateData: { title: string; message: string; actionUrl?: string }
) {
  try {
    const html = generateEmailTemplate(templateData);

    const mailOptions = {
      from: `"Zidwell App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

function generateEmailTemplate(data: { title: string; message: string; actionUrl?: string }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          }
          .notification-type {
            display: inline-block;
            background: #e5e7eb;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔔 ${data.title}</h1>
        </div>
        <div class="content">
          <div class="notification-type">App Notification</div>
          <p>${data.message}</p>
          ${data.actionUrl ? `
            <div style="text-align: center;">
              <a href="${baseUrl}${data.actionUrl}" class="button">
                View in App
              </a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your App. All rights reserved.</p>
          <p>
            <a href="${baseUrl}/dashboard/notifications" style="color: #6b7280;">
              Manage notification preferences
            </a>
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function verifyEmailTransporter() {
  try {
    await transporter.verify();
    console.log('✅ Email transporter is ready');
    return true;
  } catch (error) {
    console.error('❌ Email transporter failed:', error);
    return false;
  }
}