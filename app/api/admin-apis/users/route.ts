// app/api/admin-apis/users/route.ts
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
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ✅ Fetch regular users
    let usersQuery = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // ✅ Add search if `q` is provided
    if (q) {
      usersQuery = usersQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data: usersData, error: usersError, count: usersCount } = await usersQuery;

    if (usersError) {
      console.error('❌ Supabase error (users):', usersError.message);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // ✅ Get pending users count only
    const { count: pendingCount, error: pendingError } = await supabaseAdmin
      .from('pending_users')
      .select('*', { count: 'exact', head: true });

    if (pendingError) {
      console.error('❌ Supabase error (pending_users count):', pendingError.message);
      // Don't fail the whole request if pending users count fails
    }

    return NextResponse.json({
      users: usersData || [],
      total: usersCount || 0,
      page,
      perPage: limit,
      stats: {
        active: usersCount || 0,
        pending: pendingCount || 0
      }
    });
  } catch (err: any) {
    console.error('❌ GET /api/admin-apis/users error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}