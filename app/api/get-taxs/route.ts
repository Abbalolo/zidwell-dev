
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'User id is missing' }, { status: 400 });
    }

    const { data: receipts, error } = await supabase
      .from('tax_filings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase fetch error:', error.message);
      return NextResponse.json({ message: 'Failed to fetch tax filings' }, { status: 500 });
    }

    return NextResponse.json({ receipts }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Server error:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
