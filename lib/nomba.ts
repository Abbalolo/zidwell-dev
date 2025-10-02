let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getNombaToken() {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

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

  const response = await fetch(url, options);

  // console.log("🔑 Response:", response);
  const data = await response.json();

  // console.log("🔑 Nomba Token Response:", data);

  if (!response.ok) {
    throw new Error(data.error_description || "Failed to get Nomba token");
  }

  cachedToken = data.data.access_token;
  tokenExpiry = Math.floor(Date.now() / 1000) + data.expiresAt - 60;

  return cachedToken;
}
