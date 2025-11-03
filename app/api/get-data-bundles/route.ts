import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";

// ENHANCED DATA PLANS CACHE
const dataPlansCache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const RETRY_COUNT = 2;

// Fallback data plans in case API fails
const FALLBACK_DATA_PLANS: Record<string, any> = {
  mtn: {
    data: [
      { name: "500MB", price: 200, validity: "1 day" },
      { name: "1GB", price: 300, validity: "1 day" },
      { name: "2GB", price: 500, validity: "2 days" },
      { name: "5GB", price: 1000, validity: "7 days" }
    ],
    success: true,
    message: "Using fallback MTN data plans"
  },
  airtel: {
    data: [
      { name: "500MB", price: 200, validity: "1 day" },
      { name: "1GB", price: 300, validity: "1 day" },
      { name: "2GB", price: 500, validity: "2 days" },
      { name: "5GB", price: 1000, validity: "7 days" }
    ],
    success: true,
    message: "Using fallback Airtel data plans"
  },
  glo: {
    data: [
      { name: "500MB", price: 200, validity: "1 day" },
      { name: "1GB", price: 300, validity: "1 day" },
      { name: "2GB", price: 500, validity: "2 days" },
      { name: "5GB", price: 1000, validity: "7 days" }
    ],
    success: true,
    message: "Using fallback Glo data plans"
  },
  etisalat: {
    data: [
      { name: "500MB", price: 200, validity: "1 day" },
      { name: "1GB", price: 300, validity: "1 day" },
      { name: "2GB", price: 500, validity: "2 days" },
      { name: "5GB", price: 1000, validity: "7 days" }
    ],
    success: true,
    message: "Using fallback 9mobile data plans"
  }
};

async function getCachedDataPlans(service: string, retry = 0): Promise<any> {
  const cacheKey = `data_plans_${service.toLowerCase()}`;
  const cached = dataPlansCache.get(cacheKey);
  
  // Return cached data if available and not expired
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`✅ Using cached data plans for ${service}`);
    return cached.data;
  }
  
  console.log(`🔄 Fetching fresh data plans for ${service} from Nomba API`);
  
  try {
    const token = await getNombaToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/data-plan/${service}`,
      {
        timeout: 15000, // 15 second timeout
        headers: {
          "Content-Type": "application/json",
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Validate response structure
    if (!response.data) {
      throw new Error("Invalid response from data plans API");
    }

    // Cache the successful response
    dataPlansCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    console.log(`✅ Cached data plans for ${service}`);
    
    return response.data;
    
  } catch (error: any) {
    console.error(`❌ Failed to fetch data plans for ${service}:`, error.message);
    
    // If we have stale cache data and API fails, return stale data as fallback
    if (cached && retry >= RETRY_COUNT) {
      console.log(`🔄 Using stale cache as fallback for ${service} data plans`);
      return {
        ...cached.data,
        _fallback: true,
        _message: "Using cached data - API temporarily unavailable"
      };
    }
    
    // If no cache and max retries reached, use hardcoded fallback
    if (retry >= RETRY_COUNT && !cached) {
      const fallback = FALLBACK_DATA_PLANS[service.toLowerCase()];
      if (fallback) {
        console.log(`🔄 Using hardcoded fallback for ${service} data plans`);
        return fallback;
      }
    }
    
    // Retry logic
    if (retry < RETRY_COUNT) {
      console.log(`🔄 Retrying data plans fetch for ${service} (${retry + 1}/${RETRY_COUNT})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1))); // Exponential backoff
      return getCachedDataPlans(service, retry + 1);
    }
    
    throw error;
  }
}

 function clearDataPlansCache(service?: string) {
  if (service) {
    const cacheKey = `data_plans_${service.toLowerCase()}`;
    const existed = dataPlansCache.delete(cacheKey);
    
    if (existed) {
      console.log(`🧹 Cleared data plans cache for ${service}`);
    }
    
    return existed;
  } else {
    const count = dataPlansCache.size;
    dataPlansCache.clear();
    console.log(`🧹 Cleared all data plans cache (${count} entries)`);
    return count;
  }
}

// Export for use in other files
 async function getDataPlans(service: string) {
  return await getCachedDataPlans(service);
}

export async function GET(req: NextRequest) {
  const service = req.nextUrl.searchParams.get("service");
  const nocache = req.nextUrl.searchParams.get("nocache");
  const forceRefresh = nocache === "true";

  if (!service) {
    return NextResponse.json(
      { error: "Missing service parameter in query string" },
      { status: 400 }
    );
  }

  try {
    // Clear cache if force refresh requested
    if (forceRefresh) {
      clearDataPlansCache(service);
    }
    
    const data = await getCachedDataPlans(service);

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error(
      "Error fetching data plans:",
      error.response?.data || error.message
    );
    
    if (error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Final fallback - return hardcoded list
    const fallback = FALLBACK_DATA_PLANS[service.toLowerCase()];
    if (fallback) {
      console.log("🔄 Returning hardcoded fallback due to complete failure");
      return NextResponse.json(fallback);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch data bundle list",
        service: service,
        retry: "Please try again in a few moments"
      },
      { status: 500 }
    );
  }
}