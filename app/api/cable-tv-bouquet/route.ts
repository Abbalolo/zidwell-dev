import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";

// ENHANCED CABLE TV PRODUCTS CACHE
const cableProductsCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const RETRY_COUNT = 2; // Number of retries on failure

async function getCachedCableProducts(service: string, retry = 0): Promise<any> {
  const cacheKey = `cable_products_${service.toLowerCase()}`;
  const cached = cableProductsCache.get(cacheKey);
  
  // Return cached data if available and not expired
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`✅ Using cached cable products for ${service}`);
    return cached.data;
  }
  
  console.log(`🔄 Fetching fresh cable products for ${service}`);
  
  try {
    const token = await getNombaToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/cableTvProduct?cableTvType=${service}`,
      {
        maxBodyLength: Infinity,
        timeout: 10000, // 10 second timeout
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
      }
    );

    // Cache the successful response
    if (response.data) {
      cableProductsCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response.data;
    
  } catch (error: any) {
    console.error(`❌ Failed to fetch cable products for ${service}:`, error.message);
    
    // If we have stale cache data and API fails, return stale data as fallback
    if (cached && retry >= RETRY_COUNT) {
      console.log(`🔄 Using stale cache as fallback for ${service}`);
      return cached.data;
    }
    
    // Retry logic
    if (retry < RETRY_COUNT) {
      console.log(`🔄 Retrying cable products fetch for ${service} (${retry + 1}/${RETRY_COUNT})`);
      return getCachedCableProducts(service, retry + 1);
    }
    
    throw error;
  }
}
 function clearCableProductsCache(service?: string) {
  if (service) {
    const cacheKey = `cable_products_${service.toLowerCase()}`;
    cableProductsCache.delete(cacheKey);
    console.log(`🧹 Cleared cable products cache for ${service}`);
  } else {
    cableProductsCache.clear();
    console.log(`🧹 Cleared all cable products cache`);
  }
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
      clearCableProductsCache(service);
    }
    
    const data = await getCachedCableProducts(service);

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error(
      "Error fetching cable TV products:",
      error.response?.data || error.message
    );
    
    if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: 400,
      });
    }
    
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch cable TV products",
        service: service,
        retry: "Please try again in a few moments"
      },
      { status: 500 }
    );
  }
}