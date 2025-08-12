// app/api/get-invoices-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/app/supabase/supabase';

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
      .order('sent_at', { ascending: false });

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
