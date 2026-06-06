import { Hono } from "hono";
import { z } from "zod";
import { error } from "../utils/response.js";
import { getSolanaRpcRotator } from "../solana/rpc.js";
import { Cluster } from "../solana/types.js";

export const proxy = new Hono();

const querySchema = z.object({
  cluster: z.enum(["mainnet", "testnet", "devnet"]).default("mainnet"),
});

proxy.post("/solana", async (c) => {
  try {
    // 1. Validasi Query
    const queryResult = querySchema.safeParse(c.req.query());
    if (!queryResult.success) {
      return c.json(error("INVALID_QUERY", "Invalid cluster parameter. Use mainnet, testnet, or devnet"), 400);
    }
    const cluster = queryResult.data.cluster as Cluster;

    // 2. Baca payload JSON-RPC dari client
    const body = await c.req.text();
    if (!body) {
      return c.json(error("BAD_REQUEST", "Empty JSON-RPC payload"), 400);
    }

    // 3. Teruskan payload ke RPC Rotator
    const rotator = getSolanaRpcRotator(cluster);
    const response = await rotator.forward(body);

    // 4. Ambil teks respons dari RPC
    const data = await response.text();

    // 5. Kembalikan secara transparan ke client
    c.status(response.status as any);
    c.header("Content-Type", response.headers.get("Content-Type") || "application/json");
    return c.body(data);
  } catch (err: any) {
    console.error("[Proxy Route Error]", err);
    return c.json(error("INTERNAL_ERROR", err?.message || "An unexpected error occurred"), 500);
  }
});
