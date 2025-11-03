// app/api/electricity/providers/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";

// ENHANCED ELECTRICITY PROVIDERS CACHE
const electricityProvidersCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const RETRY_COUNT = 2;

// Fallback DISCO list in case API fails
const FALLBACK_DISCOS = {
  data: [
    { id: 'ikedc', name: 'Ikeja Electric (IKEDC)' },
    { id: 'ekedc', name: 'Eko Electric (EKEDC)' },
    { id: 'phed', name: 'Port Harcourt Electric (PHED)' },
    { id: 'kedco', name: 'Kano Electric (KEDCO)' },
    { id: 'aedc', name: 'Abuja Electric (AEDC)' },
    { id: 'ibedc', name: 'Ibadan Electric (IBEDC)' },
    { id: 'eedc', name: 'Enugu Electric (EEDC)' },
    { id: 'bedc', name: 'Benin Electric (BEDC)' },
    { id: 'jed', name: 'Jos Electric (JED)' },
    { id: 'yedc', name: 'Yola Electric (YEDC)' },
  ],
  success: true,
  message: "Using fallback DISCO list"
};

async function getCachedElectricityProviders(retry = 0): Promise<any> {
  const cacheKey = 'electricity_providers';
  const cached = electricityProvidersCache.get(cacheKey);
  
  // Return cached data if available and not expired
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached electricity providers");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh electricity providers from Nomba API");
  
  try {
    const token = await getNombaToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/electricity/discos`,
      {
        maxBodyLength: Infinity,
        timeout: 15000, // 15 second timeout
        headers: {
          "Content-Type": "application/json",
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Validate response structure
    if (!response.data || !response.data.success) {
      throw new Error("Invalid response from electricity providers API");
    }

    // Cache the successful response
    electricityProvidersCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    console.log(`✅ Cached ${response.data.data?.length || 0} electricity providers`);
    
    return response.data;
    
  } catch (error: any) {
    console.error(`❌ Failed to fetch electricity providers:`, error.message);
    
    // If we have stale cache data and API fails, return stale data as fallback
    if (cached && retry >= RETRY_COUNT) {
      console.log("🔄 Using stale cache as fallback for electricity providers");
      return {
        ...cached.data,
        _fallback: true,
        _message: "Using cached data - API temporarily unavailable"
      };
    }
    
    // If no cache and max retries reached, use hardcoded fallback
    if (retry >= RETRY_COUNT && !cached) {
      console.log("🔄 Using hardcoded fallback for electricity providers");
      return FALLBACK_DISCOS;
    }
    
    // Retry logic
    if (retry < RETRY_COUNT) {
      console.log(`🔄 Retrying electricity providers fetch (${retry + 1}/${RETRY_COUNT})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1))); // Exponential backoff
      return getCachedElectricityProviders(retry + 1);
    }
    
    throw error;
  }
}

// Remove exports - these functions should only be used internally
function clearElectricityProvidersCache() {
  electricityProvidersCache.clear();
  console.log("🧹 Cleared electricity providers cache");
}

export async function GET() {
  try {
    const data = await getCachedElectricityProviders();
    
    // Add cache metadata to response
    const responseWithMetadata = {
      ...data,
      _cache: {
        cached: electricityProvidersCache.has('electricity_providers'),
        timestamp: Date.now(),
        source: data._fallback ? 'fallback' : (data._message ? 'stale_cache' : 'fresh')
      }
    };
    
    return NextResponse.json(responseWithMetadata);
    
  } catch (error: any) {
    console.error(
      "Electricity provider fetch error:",
      error.response?.data || error.message
    );
    
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Final fallback - return hardcoded list
    console.log("🔄 Returning hardcoded fallback due to complete failure");
    return NextResponse.json(FALLBACK_DISCOS);
  }
}