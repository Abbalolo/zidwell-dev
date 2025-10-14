import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ GET: Fetch paginated users with optional search
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = 20; // Adjust as needed
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ✅ Select all columns to avoid errors if names differ
    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' }) // <- count: 'exact' if you want total count for pagination
      .order('created_at', { ascending: false })
      .range(from, to);

    // ✅ Add search if `q` is provided
    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: data,
      total: count,
      page,
      perPage: limit,
    });
  } catch (err: any) {
    console.error('❌ GET /api/admin-apis/users error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
