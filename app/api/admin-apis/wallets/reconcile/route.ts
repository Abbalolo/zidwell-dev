import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache for reconciliation results (longer TTL since it's expensive)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

// Cache for Nomba balance
let _cachedNomba = { ts: 0, value: 0 };
const NOMBA_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Real Nomba payment gateway service
class NombaPaymentGatewayService {
  async getGatewayBalance(): Promise<number> {
    try {
      const now = Date.now();
      if (now - _cachedNomba.ts < NOMBA_CACHE_TTL) {
        console.log("Using cached Nomba balance");
        return _cachedNomba.value;
      }

      const token = await getNombaToken();
      if (!token) {
        console.warn("No Nomba token available");
        return 0;
      }

      // Validate environment variables
      const nombaUrl = process.env.NOMBA_URL;
      const accountId = process.env.NOMBA_ACCOUNT_ID;
      
      if (!nombaUrl || !accountId) {
        console.error("Missing Nomba environment variables");
        return 0;
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        accountId: accountId,
      };

      const res = await fetch(
        `${nombaUrl}/v1/accounts/balance`,
        {
          method: "GET",
          headers: headers,
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Nomba fetch failed:", res.status, txt);
        return 0;
      }

      const data = await res.json().catch(() => ({}));
      const amount = Number(data?.data?.amount ?? 0);
      _cachedNomba = { ts: now, value: amount };
      console.log(`✅ Nomba gateway balance: ₦${amount.toLocaleString()}`);
      return amount;
    } catch (err) {
      console.error("Error fetching Nomba balance:", err);
      return 0;
    }
  }

  async getUserBalance(userId: string): Promise<number> {
    // Since Nomba API gives the total gateway balance,
    // we need to calculate individual user balances differently
    // This is a simplified approach - you might need to adjust based on your business logic
    
    try {
      // Get user's total successful transactions from your system
      const { data: userTransactions, error } = await supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('user_id', userId)
        .eq('status', 'success');

      if (error) {
        console.error(`Error fetching transactions for user ${userId}:`, error);
        return 0;
      }

      // Calculate user's net balance from transactions
      let userNetBalance = 0;
      userTransactions?.forEach(transaction => {
        if (transaction.type === 'CREDIT') {
          userNetBalance += Number(transaction.amount) || 0;
        } else if (transaction.type === 'DEBIT') {
          userNetBalance -= Number(transaction.amount) || 0;
        }
      });

      return Math.max(0, userNetBalance); // Balance shouldn't be negative
    } catch (error) {
      console.error(`Error calculating gateway balance for user ${userId}:`, error);
      return 0;
    }
  }
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export async function POST(request: NextRequest) {
  try {
    // Admin authentication using the utility file
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const cacheKey = 'reconciliation:latest';
    
    // Check cache first for reconciliation results
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('💰 Cache hit for reconciliation API');
      return NextResponse.json(cached.data);
    }

    const gatewayService = new NombaPaymentGatewayService();

    // Get all users with wallet_balance from users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        wallet_balance
      `)
      .not('wallet_balance', 'is', null);

    if (usersError) {
      throw usersError;
    }

    const discrepancies = [];
    const reconciliationResults = [];
    
    // Get total Nomba gateway balance
    const totalGatewayBalance = await gatewayService.getGatewayBalance();
    let totalCalculatedUserBalances = 0;

    // Check each user's wallet_balance against payment gateway
    for (const user of users || []) {
      try {
        const systemBalance = user.wallet_balance || 0;
        const gatewayUserBalance = await gatewayService.getUserBalance(user.id);
        
        totalCalculatedUserBalances += gatewayUserBalance;

        const difference = gatewayUserBalance - systemBalance;
        const isDiscrepant = Math.abs(difference) > 0.01;

        const result = {
          user_id: user.id,
          user_email: user.email,
          system_balance: systemBalance,
          gateway_balance: gatewayUserBalance,
          difference,
          status: isDiscrepant ? 'DISCREPANCY' : 'OK',
        };

        reconciliationResults.push(result);

        if (isDiscrepant) {
          discrepancies.push(result);
        }

      } catch (error: any) {
        console.error(`Reconciliation failed for user ${user.email}:`, error);
        
        reconciliationResults.push({
          user_id: user.id,
          user_email: user.email,
          system_balance: user.wallet_balance || 0,
          gateway_balance: null,
          difference: null,
          status: 'ERROR',
          error: error.message,
        });
      }
    }

    // Calculate overall system vs gateway discrepancy
    const totalSystemBalance = reconciliationResults.reduce((sum, r) => sum + (r.system_balance || 0), 0);
    const overallDifference = totalGatewayBalance - totalSystemBalance;
    const hasOverallDiscrepancy = Math.abs(overallDifference) > 0.01;

    const responseData = {
      success: true,
      checked: users?.length || 0,
      discrepanciesFound: discrepancies.length,
      hasOverallDiscrepancy,
      overallDifference,
      discrepancies,
      summary: {
        totalSystemBalance,
        totalGatewayBalance,
        totalCalculatedUserBalances,
        totalDifference: overallDifference,
        systemVsGatewayMatch: !hasOverallDiscrepancy,
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString(),
      },
      gatewayInfo: {
        name: 'Nomba',
        totalBalance: totalGatewayBalance,
        lastChecked: new Date().toISOString(),
      }
    };

    // Cache the expensive reconciliation result
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });



    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Reconciliation API Error:', error);
    return NextResponse.json(
      { error: 'Reconciliation failed: ' + error.message },
      { status: 500 }
    );
  }
}

// Clear reconciliation cache
export async function DELETE(request: NextRequest) {
  try {
    // Admin authentication for DELETE requests too
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    cache.clear();
    _cachedNomba = { ts: 0, value: 0 }; 
    
    return NextResponse.json({ 
      message: 'Reconciliation cache cleared',
      clearedBy: adminUser?.email,
      clearedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Clear cache error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache: ' + error.message },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check gateway status
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const gatewayService = new NombaPaymentGatewayService();
    const gatewayBalance = await gatewayService.getGatewayBalance();

    return NextResponse.json({
      gateway: 'Nomba',
      balance: gatewayBalance,
      lastUpdated: new Date(_cachedNomba.ts).toISOString(),
      isCached: Date.now() - _cachedNomba.ts < NOMBA_CACHE_TTL,
      checkedBy: adminUser?.email
    });
  } catch (error: any) {
    console.error('Gateway status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check gateway status: ' + error.message },
      { status: 500 }
    );
  }
}