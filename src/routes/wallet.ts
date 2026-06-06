import { Hono } from "hono";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { success, error } from "../utils/response";
import { getConnection } from "../solana/client";
import { getWalletAssets } from "../solana/assets";
import { Cluster } from "../solana/types";

export const wallet = new Hono();

const querySchema = z.object({
  cluster: z.enum(["mainnet", "testnet", "devnet"]).default("mainnet"),
});

wallet.get("/solana/:address/assets", async (c) => {
  try {
    const address = c.req.param("address");
    
    // Parse Query
    const queryResult = querySchema.safeParse(c.req.query());
    if (!queryResult.success) {
      return c.json(error("INVALID_QUERY", "Invalid cluster parameter. Use mainnet, testnet, or devnet"), 400);
    }
    const cluster = queryResult.data.cluster as Cluster;

    // Validate Address
    try {
      new PublicKey(address);
    } catch {
      return c.json(error("INVALID_ADDRESS", "Invalid Solana address"), 400);
    }

    // Process
    const connection = getConnection(cluster);
    const assets = await getWalletAssets(connection, address);

    return c.json(success({
      address,
      assets,
    }));
  } catch (err: any) {
    console.error("[Wallet Route Error]", err);
    return c.json(error("INTERNAL_ERROR", err?.message || "An unexpected error occurred"), 500);
  }
});
