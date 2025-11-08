import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Admin authentication using the utility file
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { userId, type, amount, reason, adminNote } = await request.json();

    // Validation
    if (!userId || !type || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'credit' && type !== 'debit') {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Get current user with wallet_balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, wallet_balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check sufficient balance for debit
    if (type === 'debit' && (user.wallet_balance || 0) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance for debit operation' },
        { status: 400 }
      );
    }

    // Calculate new balance
    const newBalance = type === 'credit' 
      ? (user.wallet_balance || 0) + amount
      : (user.wallet_balance || 0) - amount;

    const transactionId = `MANUAL_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Update user's wallet_balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: newBalance,
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: type.toUpperCase(),
        amount: amount,
        status: 'COMPLETED',
        reference: transactionId,
        description: reason,
        narration: adminNote || `Manual ${type} by admin`,
        fee: 0,
        total_deduction: 0,
        channel: 'admin_dashboard',
        external_response: {
          adminEmail: adminUser?.email || 'admin@system',
          processedAt: now,
          balanceBefore: user.wallet_balance || 0,
          balanceAfter: newBalance,
          type: 'manual_admin_adjustment'
        },
        created_at: now,
      })
      .select()
      .single();

    if (txError) {
      throw txError;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${type}ed ₦${amount.toLocaleString()}`,
      newBalance: newBalance,
      transactionId: transaction.id,
    });

  } catch (error: any) {
    console.error('Transaction API Error:', error);
    return NextResponse.json(
      { error: 'Transaction failed: ' + error.message },
      { status: 500 }
    );
  }
}