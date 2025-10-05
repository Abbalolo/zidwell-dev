// app/api/admin/transactions/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'


const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function GET(req: Request) {
const url = new URL(req.url)
const page = Number(url.searchParams.get('page') ?? 1)
const limit = 50
const from = (page - 1) * limit
const { data, error } = await supabaseAdmin
.from('transactions')
.select('id, wallet_id, user_id, type, amount, status, reference, created_at')
.order('created_at', { ascending: false })
.range(from, from + limit - 1)


if (error) return NextResponse.json({ error: error.message }, { status: 500 })
return NextResponse.json({ transactions: data })
}