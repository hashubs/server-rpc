import { Connection } from "@solana/web3.js";
import { Cluster } from "./types";
import { getSolanaRpcRotator } from "./rpc";

const connections: Record<string, Connection> = {};

export function getConnection(cluster: Cluster): Connection {
  if (!connections[cluster]) {
    const rotator = getSolanaRpcRotator(cluster);

    connections[cluster] = new Connection("https://dummy.solana.rpc", {
      fetch: async (url, options) => {
        return rotator.forward(options?.body as string | null, options?.method);
      },
    });
  }
  
  return connections[cluster];
}
