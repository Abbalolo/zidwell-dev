// /app/api/get-contracts/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ message: 'User email is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('initiator_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json({ message: 'Failed to fetch contracts' }, { status: 500 });
    }

    return NextResponse.json({ contracts: data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
