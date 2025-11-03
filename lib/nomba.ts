let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getNombaToken() {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if it exists and isn't expired
  if (cachedToken && now < tokenExpiry) {
    console.log("✅ Using cached Nomba token");
    return cachedToken;
  }

  console.log("🔄 Fetching new Nomba token");
  
  const url = `${process.env.NOMBA_URL}/v1/auth/token/issue`;
  const options = {
    method: "POST",
    headers: {
      accountId: process.env.NOMBA_ACCOUNT_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.NOMBA_CLIENT_ID!,
      client_secret: process.env.NOMBA_PRIVATE_KEY!,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Debug: log the full response to see what fields are available
    console.log("🔍 Full Nomba token response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error_description || "Failed to get Nomba token");
    }

    if (!data.data?.access_token) {
      throw new Error("No access token in response");
    }

    // Cache the new token
    cachedToken = data.data.access_token;
    
    // Calculate expiry - try different possible field names
    let expiresIn = data.expires_in || data.expiresIn || data.expiresAt || data.data.expires_in;
    
    // If no expires_in found, default to 1 hour (3600 seconds)
    if (!expiresIn) {
      console.log("⚠️ No expiration time found, defaulting to 1 hour");
      expiresIn = 3600;
    }
    
    // Set expiry with 5-minute safety margin
    tokenExpiry = now + expiresIn - 300;
    
    console.log(`✅ New token cached. Expires in: ${expiresIn} seconds`);
    console.log(`⏰ Token valid until: ${new Date(tokenExpiry * 1000).toLocaleString()}`);
    
    return cachedToken;
  } catch (error) {
    console.error("❌ Failed to get Nomba token:", error);
    
    // Clear cache on error
    cachedToken = null;
    tokenExpiry = 0;
    
    throw error;
  }
}