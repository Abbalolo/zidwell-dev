// app/api/admin-apis/disputes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';
import { dispatchBulkNotifications } from '@/lib/notification-service';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch specific dispute
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const params = await context.params;
    const disputeId = params.id;

    // Fetch dispute with related data
    const { data: dispute, error } = await supabase
      .from('disputes')
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name
        ),
        admin_users:admin_id (
          id,
          email,
          full_name
        )
      `)
      .eq('id', disputeId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      dispute,
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('GET dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update dispute
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const params = await context.params;
    const disputeId = params.id;
    const body = await request.json();

    // Update dispute
    const { data: dispute, error } = await supabase
      .from('disputes')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
        updated_by: adminUser?.id
      })
      .eq('id', disputeId)
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Send notification if status changed
    if (body.status && dispute.user_id) {
      await dispatchBulkNotifications({
        userIds: [dispute.user_id],
        title: 'Dispute Updated',
        message: `Your dispute #${disputeId} status has been updated to ${body.status}`,
        type: 'info'
      });
    }

    return NextResponse.json({ 
      dispute,
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('PUT dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove dispute
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const params = await context.params;
    const disputeId = params.id;

    // Get dispute before deletion for notification
    const { data: dispute } = await supabase
      .from('disputes')
      .select('user_id')
      .eq('id', disputeId)
      .single();

    // Delete dispute
    const { error } = await supabase
      .from('disputes')
      .delete()
      .eq('id', disputeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Send notification if user exists
    if (dispute?.user_id) {
      await dispatchBulkNotifications({
        userIds: [dispute.user_id],
        title: 'Dispute Resolved',
        message: `Your dispute #${disputeId} has been resolved and closed`,
        type: 'success'
      });
    }

    return NextResponse.json({ 
      message: 'Dispute deleted successfully',
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('DELETE dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Partial update (e.g., resolve dispute)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const params = await context.params;
    const disputeId = params.id;
    const body = await request.json();

    // Resolve dispute
    const { data: dispute, error } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: adminUser?.id,
        resolution_notes: body.resolution_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Send notification to user
    if (dispute.user_id) {
      await dispatchBulkNotifications({
        userIds: [dispute.user_id],
        title: 'Dispute Resolved',
        message: `Your dispute #${disputeId} has been resolved. ${body.resolution_notes || ''}`,
        type: 'success'
      });
    }

    return NextResponse.json({ 
      dispute,
      message: 'Dispute resolved successfully',
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('PATCH dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}