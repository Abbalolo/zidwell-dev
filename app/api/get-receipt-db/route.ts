// app/api/get-invoices-db/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ message: 'User email is required' }, { status: 400 });
    }

    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('initiator_email', userEmail)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase fetch error:', error.message);
      return NextResponse.json({ message: 'Failed to fetch reciepts' }, { status: 500 });
    }

    return NextResponse.json({ receipts }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Server error:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
