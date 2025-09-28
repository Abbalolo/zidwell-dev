// app/api/get-invoices-db/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ message: 'User email is required' }, { status: 400 });
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('initiator_email', userEmail)
      .order('created_at', { ascending: false });

      // console.log('Fetched invoices:', invoices);

    if (error) {
      console.error('❌ Supabase fetch error:', error.message);
      return NextResponse.json({ message: 'Failed to fetch invoices' }, { status: 500 });
    }

    return NextResponse.json({ invoices }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Server error:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
