import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('kyc')
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter
    if (search) {
      // Search in user data through the join
      query = query.or(`users.email.ilike.%${search}%,users.first_name.ilike.%${search}%,users.last_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Supabase error (kyc):', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate signed URLs for file access
    const applicationsWithSignedUrls = await Promise.all(
      (data || []).map(async (kyc) => {
        let signedIdCardUrl = null;
        let signedUtilityBillUrl = null;

        // Generate signed URL for ID card if exists
        if (kyc.id_card_url) {
          try {
            const { data: signedUrl } = await supabaseAdmin.storage
              .from('kyc-documents') // Replace with your actual bucket name
              .createSignedUrl(kyc.id_card_url, 3600); // 1 hour expiry
            signedIdCardUrl = signedUrl?.signedUrl;
          } catch (error) {
            console.error('Error generating signed URL for ID card:', error);
          }
        }

        // Generate signed URL for utility bill if exists
        if (kyc.utility_bill_url) {
          try {
            const { data: signedUrl } = await supabaseAdmin.storage
              .from('kyc-documents') // Replace with your actual bucket name
              .createSignedUrl(kyc.utility_bill_url, 3600); // 1 hour expiry
            signedUtilityBillUrl = signedUrl?.signedUrl;
          } catch (error) {
            console.error('Error generating signed URL for utility bill:', error);
          }
        }

        return {
          ...kyc,
          signed_id_card_url: signedIdCardUrl,
          signed_utility_bill_url: signedUtilityBillUrl,
          user: kyc.users || null
        };
      })
    );

    return NextResponse.json({
      applications: applicationsWithSignedUrls,
      total: count || 0,
      page,
      perPage: limit,
    });
  } catch (err: any) {
    console.error('❌ GET /api/admin-apis/kyc error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ PATCH: Update KYC status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { kycId, status, adminNotes } = body;

    if (!kycId || !status) {
      return NextResponse.json({ error: 'KYC ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('kyc')
      .update({
        status,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', kycId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error (update kyc):', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'KYC status updated successfully',
      application: data 
    });
  } catch (err: any) {
    console.error('❌ PATCH /api/admin-apis/kyc error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}