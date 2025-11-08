import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth'; 
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache configuration
const CACHE_TTL = 60 * 1000; // 1 minute in milliseconds
const cache = new Map();

function generateCacheKey(searchParams: URLSearchParams): string {
  return `wallets:${searchParams.toString()}`;
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
      console.log('💰 Cache hit for wallets API');
      return NextResponse.json(cached.data);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const balanceFilter = searchParams.get('balance') || 'all';
    const range = searchParams.get('range') || 'total';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query - now querying users table for wallet_balance
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        wallet_balance,
        bank_account_name,
        bank_account_number,
        created_at
      `, { count: 'exact' })
      .not('wallet_balance', 'is', null); // Only users with wallet balance

    // Search by email, first name, or last name
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Balance filters - using wallet_balance from users table
    if (balanceFilter !== 'all') {
      switch (balanceFilter) {
        case 'high':
          query = query.gte('wallet_balance', 10000);
          break;
        case 'medium':
          query = query.gte('wallet_balance', 1000).lt('wallet_balance', 10000);
          break;
        case 'low':
          query = query.lt('wallet_balance', 1000).gt('wallet_balance', 0);
          break;
        case 'zero':
          query = query.eq('wallet_balance', 0);
          break;
      }
    }

    // Date range filtering - using created_at from users table
    if (range !== 'total' && !startDate) {
      const now = new Date();
      let startDateFilter = new Date();

      switch (range) {
        case 'today':
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDateFilter.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDateFilter.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDateFilter.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte('created_at', startDateFilter.toISOString());
    }

    // Custom date range
    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      query = query
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
    }

    // Execute query with pagination
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    // Format response to match frontend expectations
    const formattedWallets = users?.map(user => ({
      id: user.id,
      user_id: user.id,
      email: user.email,
      name: user.first_name,
      last_name: user.last_name,
      bank_account_name: user.bank_account_name,
      bank_account_number: user.bank_account_number,
      balance: user.wallet_balance || 0,
      last_updated: user.created_at,
      created_at: user.created_at,
    })) || [];

    const responseData = {
      wallets: formattedWallets,
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

    // Clean up old cache entries (optional)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Wallet API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Clear cache on POST requests (like when transactions occur)
export async function POST(request: NextRequest) {
  // Admin authentication for POST requests too
  const adminUser = await requireAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;

  cache.clear();
  return NextResponse.json({ message: 'Cache cleared' });
}