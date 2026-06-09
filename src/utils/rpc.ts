const isRetryable = (status: number) => status === 429 || status >= 500;

export interface RpcConfig {
  /** Daftar RPC URL untuk setiap cluster/network */
  urls: string[];
  /** Set URL yang membutuhkan API key khusus (misal Tatum) */
  specialUrls?: Set<string>;
  /** Daftar API key yang akan dirotasi untuk specialUrls */
  apiKeys?: string[];
  /** Header key untuk API key (misal 'x-api-key') */
  apiKeyHeaderName?: string;
}

export class RpcRotator {
  private keyIndex = 0;
  private config: RpcConfig;

  constructor(config: RpcConfig) {
    this.config = config;
  }

  async forward(
    body: string | null,
    method: string = "POST",
  ): Promise<Response> {
    const rpcList = this.config.urls;
    if (rpcList.length === 0) {
      throw new Error("No RPC URLs configured");
    }

    const startRpc = Math.floor(Math.random() * rpcList.length);
    let lastError = "";

    for (let i = 0; i < rpcList.length; i++) {
      const target = rpcList[(startRpc + i) % rpcList.length];
      const isSpecial = this.config.specialUrls?.has(target) ?? false;
      const apiKeys = this.config.apiKeys ?? [];
      const attempts = isSpecial && apiKeys.length > 0 ? apiKeys.length : 1;

      for (let k = 0; k < attempts; k++) {
        const headers: Record<string, string> = {
          "content-type": "application/json",
        };

        if (isSpecial && apiKeys.length > 0 && this.config.apiKeyHeaderName) {
          const keyIdx = (this.keyIndex + k) % apiKeys.length;
          headers[this.config.apiKeyHeaderName] = apiKeys[keyIdx];
        }

        try {
          const reqBodyParsed = body ? JSON.parse(body) : {};
          const methodName = Array.isArray(reqBodyParsed)
            ? `Batch(${reqBodyParsed.length})`
            : reqBodyParsed.method || method;

          console.log(`[RPC ->] Target: ${target} | Method: ${methodName}`);

          const response = await fetch(target, {
            method,
            headers,
            body: body || undefined,
          });

          let isProviderError = false;
          if (
            response.status === 429 ||
            response.status === 401 ||
            response.status === 403 ||
            response.status >= 500
          ) {
            isProviderError = true;
          }

          if (!isProviderError && response.status === 200) {
            try {
              const cloned = response.clone();
              const data = await cloned.json();
              const checkError = (err: any) =>
                err &&
                (err.code === -16401 ||
                  (err.message &&
                    err.message.toLowerCase().includes("paid plan")));

              if (Array.isArray(data)) {
                if (data.some((d) => checkError(d.error)))
                  isProviderError = true;
              } else if (data && data.error) {
                if (checkError(data.error)) isProviderError = true;
              }
            } catch (e) {}
          }

          if (!isProviderError) {
            console.log(`[RPC <-] Success from: ${target}`);
            if (isSpecial && apiKeys.length > 0) {
              this.keyIndex = (this.keyIndex + k + 1) % apiKeys.length;
            }
            return response;
          }

          console.log(
            `[RPC !] Provider Limit/Error from: ${target} (HTTP ${response.status}). Retrying...`,
          );
          lastError = `${target} status ${response.status} (Provider Error)${
            isSpecial ? ` (key ${k + 1}/${attempts})` : ""
          }`;

          if (response.status >= 500) break;
        } catch (err) {
          lastError = `${target} failed: ${err instanceof Error ? err.message : "unknown"}`;
          break;
        }
      }
    }

    throw new Error(lastError || "all RPCs failed");
  }
}
