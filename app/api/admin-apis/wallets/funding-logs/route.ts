import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache configuration
const CACHE_TTL = 30 * 1000; // 30 seconds
const cache = new Map();

function generateCacheKey(searchParams: URLSearchParams): string {
  return `funding-logs:${searchParams.toString()}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export async function GET(request: NextRequest) {
  try {
    // Admin authentication using the utility file
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { searchParams } = new URL(request.url);
    const cacheKey = generateCacheKey(searchParams);

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('💰 Cache hit for funding logs API');
      return NextResponse.json(cached.data);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // First, get the transactions
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .or('description.ilike.%funding%,description.ilike.%deposit%,narration.ilike.%funding%,narration.ilike.%deposit%');

    if (type === 'funding') {
      query = query.eq('type', 'CREDIT');
    } else if (type === 'withdrawal') {
      query = query.eq('type', 'DEBIT');
    }

    // Add search filter
    if (search) {
      query = query.or(`reference.ilike.%${search}%,description.ilike.%${search}%,narration.ilike.%${search}%`);
    }

    // Add status filter
    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    // Execute transactions query
    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    // Get unique user IDs from the transactions
    const userIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean))];
    
    // Fetch user emails in a separate query
    let userEmails: { [key: string]: string } = {};
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (!usersError && users) {
        // Create a mapping of user_id to email
        users.forEach(user => {
          userEmails[user.id] = user.email;
        });
      }
    }

    // Format the logs with user emails
    const formattedLogs = logs?.map(log => ({
      id: log.id,
      user_email: userEmails[log.user_id] || 'Unknown',
      type: (log.description?.toLowerCase().includes('funding') || 
             log.narration?.toLowerCase().includes('funding') || 
             log.description?.toLowerCase().includes('deposit')) ? 'funding' : 'withdrawal',
      amount: log.amount,
      gateway: log.channel || 'manual',
      reference_id: log.reference,
      status: log.status?.toLowerCase() || 'unknown',
      created_at: log.created_at,
      metadata: log.external_response,
    })) || [];

    const responseData = {
      logs: formattedLogs,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };

    // Cache the response
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Funding Logs API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin authentication for POST requests too
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    // Clear cache
    cache.clear();
    return NextResponse.json({ message: 'Cache cleared successfully' });
    
  } catch (error: any) {
    console.error('Funding Logs POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}