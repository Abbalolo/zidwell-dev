import { transporter } from '@/lib/node-mailer';
import { NextRequest, NextResponse } from 'next/server';

interface EmailNotificationData {
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
  timestamp: string;
}

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;



export async function POST(request: NextRequest) {
  try {
    const body: EmailNotificationData = await request.json();
    
    const { type, user, transaction, device, timestamp } = body;

    let emailSubject = '';
    let emailHtml = '';

    console.log('Preparing to send email notification:', user);

    switch (type) {
      case 'login':
        emailSubject = `Security Alert: New Login to Your Account`;
        emailHtml = generateLoginEmail(user, device, timestamp);
        break;

      case 'debit':
        emailSubject = `Debit Alert: ₦${transaction?.amount.toLocaleString()} ${transaction?.description}`;
        emailHtml = generateDebitEmail(user, transaction!, timestamp);
        break;

      case 'credit':
        emailSubject = `Credit Alert: ₦${transaction?.amount.toLocaleString()} ${transaction?.description}`;
        emailHtml = generateCreditEmail(user, transaction!, timestamp);
        break;

      case 'alert':
        emailSubject = `Account Alert: ${transaction?.description}`;
        emailHtml = generateAlertEmail(user, transaction!, timestamp);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    // Send email using Nodemailer

    
    const mailOptions = {
      from: "Zidwell App",
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log notification for audit purposes
    console.log(`Email notification sent: ${type} to ${user.email}`, result.messageId);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Email Template Generators (same as before)
function generateLoginEmail(user: any, device: any, timestamp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #C29307; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .alert spam a {margin-left: 15px; }
        .alert spam {font-weight: bold; }
        .info-box { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Security Alert</h1>
        </div>
        <div class="content">
          <h2>New Login Detected</h2>
          <p>Hello ${user.full_name},</p>
          <p>We noticed a recent login to your account:</p>
          
          <div class="info-box">
            <p><strong>Account:</strong> ${user.email || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            ${device?.browser ? `<p><strong>Browser:</strong> ${device.browser}</p>` : ''}
            ${device?.os ? `<p><strong>Operating System:</strong> ${device.os}</p>` : ''}
            ${device?.location ? `<p><strong>Location:</strong> ${device.location}</p>` : ''}
            ${device?.ip_address ? `<p><strong>IP Address:</strong> ${device.ip_address}</p>` : ''}
          </div>

          <div class="alert">
            <p><strong>If this wasn't you:</strong></p>
            <p>• Change your password immediately <a href="${baseUrl}/auth/password-reset">Click here</a></p>
            <p>• Contact our support team <spam>07069175399</spam></p>
          </div>

          <p>Thank you for keeping your account secure.</p>
          <p><strong>Zidwell App Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDebitEmail(user: any, transaction: any, timestamp: string): string {
  const isTransfer = transaction.type?.includes('transfer');
  const isBillPayment = transaction.type?.includes('bill') || transaction.type?.includes('payment');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 24px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .recipient-info { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Debit Alert</h1>
        </div>
        <div class="content">
          <h2>Transaction Notification</h2>
          <p>Hello ${user.full_name},</p>
          
          <div class="amount">
            -₦${transaction.amount.toLocaleString()}
          </div>

          <div class="info-box">
            <p><strong>Description:</strong> ${transaction.description}</p>
            <p><strong>Transaction Type:</strong> ${transaction.type}</p>
            <p><strong>Reference:</strong> ${transaction.reference}</p>
            <p><strong>Date & Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            ${transaction.balance_after ? `<p><strong>Available Balance:</strong> ₦${transaction.balance_after.toLocaleString()}</p>` : ''}
          </div>

          ${isTransfer && transaction.recipient_name ? `
          <div class="recipient-info">
            <h3>Recipient Details</h3>
            <p><strong>Name:</strong> ${transaction.recipient_name}</p>
            ${transaction.recipient_account ? `<p><strong>Account:</strong> ${transaction.recipient_account}</p>` : ''}
            ${transaction.recipient_bank ? `<p><strong>Bank:</strong> ${transaction.recipient_bank}</p>` : ''}
          </div>
          ` : ''}

          ${isBillPayment ? `
          <div class="recipient-info">
            <h3>Payment Details</h3>
            <p>Your ${transaction.description} has been processed successfully.</p>
          </div>
          ` : ''}

          <p>If you didn't authorize this transaction, please contact our support team immediately.</p>
          <p><strong>Zidwell App Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCreditEmail(user: any, transaction: any, timestamp: string): string {
  const isTransfer = transaction.type?.includes('transfer');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .sender-info { background: #d1fae5; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Credit Alert</h1>
        </div>
        <div class="content">
          <h2>Funds Received</h2>
          <p>Hello ${user.full_name},</p>
          
          <div class="amount">
            +₦${transaction.amount.toLocaleString()}
          </div>

          <div class="info-box">
            <p><strong>Description:</strong> ${transaction.description}</p>
            <p><strong>Transaction Type:</strong> ${transaction.type}</p>
            <p><strong>Reference:</strong> ${transaction.reference}</p>
            <p><strong>Date & Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            ${transaction.balance_after ? `<p><strong>Available Balance:</strong> ₦${transaction.balance_after.toLocaleString()}</p>` : ''}
          </div>

          ${isTransfer && transaction.sender_name ? `
          <div class="sender-info">
            <h3>Sender Details</h3>
            <p><strong>From:</strong> ${transaction.sender_name}</p>
            ${transaction.sender_account ? `<p><strong>Account:</strong> ${transaction.sender_account}</p>` : ''}
          </div>
          ` : ''}

          <p>Your account has been credited successfully.</p>
          <p><strong>Zidwell App Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAlertEmail(user: any, transaction: any, timestamp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .alert { background: #dbeafe; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Alert</h1>
        </div>
        <div class="content">
          <h2>Important Notification</h2>
          <p>Hello ${user.full_name},</p>
          
          <div class="alert">
            <p><strong>${transaction.description}</strong></p>
            ${transaction.amount ? `<p><strong>Amount:</strong> ₦${transaction.amount.toLocaleString()}</p>` : ''}
            ${transaction.reference ? `<p><strong>Reference:</strong> ${transaction.reference}</p>` : ''}
          </div>

          <div class="info-box">
            <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            <p><strong>Account:</strong> ${user.account_number || 'N/A'}</p>
          </div>

          <p>This is an automated alert from your Zidwell App account.</p>
          <p><strong>Zidwell App Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}