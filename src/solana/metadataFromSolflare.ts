export interface SolflareToken {
  name: string;
  symbol: string;
  decimals: number;
  mint: string;
  imageUri: string;
  verified: boolean;
  price?: {
    usdPrice: number;
    usdChange?: number;
  };
}

let cachedTokens: Record<string, SolflareToken> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60;
let fetchPromise: Promise<Record<string, SolflareToken>> | null = null;

async function fetchAllSolflareTokens(): Promise<
  Record<string, SolflareToken>
> {
  const now = Date.now();
  if (cachedTokens && now - lastFetchTime < CACHE_TTL) {
    return cachedTokens;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch(
        "https://wallet-api.solflare.com/v2/swap/capped-tokens?currency=USD",
        {
          headers: {
            Accept: "application/json",
            Authorization: "Bearer fe6adfeb-ca31-442f-acfe-0d8094eb996e",
            "X-User-Agent": "Solflare-Popup-2.27.4",
            "X-Cache-Bypass": "no-cache",
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
          },
        },
      );

      if (!res.ok) return cachedTokens || {};

      const data = await res.json();
      const tokensArray = data.tokens || [];

      const tokensMap: Record<string, SolflareToken> = {};
      for (const token of tokensArray) {
        tokensMap[token.mint] = token;
      }

      cachedTokens = tokensMap;
      lastFetchTime = Date.now();
      return cachedTokens;
    } catch (error) {
      return cachedTokens || {};
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function getSolflareMetadataMap(
  mints: string[],
): Promise<Record<string, SolflareToken>> {
  if (mints.length === 0) return {};

  const allTokens = await fetchAllSolflareTokens();
  const resultMap: Record<string, SolflareToken> = {};

  for (const mint of mints) {
    if (allTokens[mint]) {
      resultMap[mint] = allTokens[mint];
    }
  }

  return resultMap;
}

export async function getSolflareNativeSol(): Promise<SolflareToken | null> {
  const allTokens = await fetchAllSolflareTokens();
  return allTokens["So11111111111111111111111111111111111111112"] || null;
}
