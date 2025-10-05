// app/api/admin/users/[id]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server'



const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest,
   { params }: { params: Promise<{ id: any }> }
) {

   const id = (await params).id;
const { data, error } = await supabaseAdmin.from('users').select('id, email, full_name, phone, balance, role, metadata').eq('id', id).single()
if (error) return NextResponse.json({ error: error.message }, { status: 404 })
return NextResponse.json({ user: data })
}


export async function PATCH(req: NextRequest,
   { params }: { params: Promise<{ id: any }> }
) {

   const id = (await params).id;
const body = await req.json()
const { data, error } = await supabaseAdmin.from('users').update(body).eq('id', id).select().single()
if (error) return NextResponse.json({ error: error.message }, { status: 500 })
return NextResponse.json({ user: data })
}


export async function DELETE(req: NextRequest,
   { params }: { params: Promise<{ id: any }> }
) {

   const id = (await params).id;
const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
if (error) return NextResponse.json({ error: error.message }, { status: 500 })
return NextResponse.json({ ok: true })
}