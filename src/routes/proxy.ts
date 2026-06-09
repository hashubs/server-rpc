import { Hono } from "hono";
import { z } from "zod";
import { error } from "../utils/response";
import { getSolanaRpcRotator } from "../solana/rpc";
import { Cluster } from "../solana/types";

export const proxy = new Hono();

const querySchema = z.object({
  cluster: z.enum(["mainnet", "testnet", "devnet"]).default("mainnet"),
});

proxy.post("/solana", async (c) => {
  try {
    const queryResult = querySchema.safeParse(c.req.query());
    if (!queryResult.success) {
      return c.json(error("INVALID_QUERY", "Invalid cluster parameter. Use mainnet, testnet, or devnet"), 400);
    }
    const cluster = queryResult.data.cluster as Cluster;

    const body = await c.req.text();
    if (!body) {
      return c.json(error("BAD_REQUEST", "Empty JSON-RPC payload"), 400);
    }

    const rotator = getSolanaRpcRotator(cluster);
    const response = await rotator.forward(body);

    const data = await response.text();

    c.status(response.status as any);
    c.header("Content-Type", response.headers.get("Content-Type") || "application/json");
    return c.body(data);
  } catch (err: any) {
    console.error("[Proxy Route Error]", err);
    return c.json(error("INTERNAL_ERROR", err?.message || "An unexpected error occurred"), 500);
  }
});
