import { Connection } from "@solana/web3.js";
import { Cluster } from "./types.js";
import { getSolanaRpcRotator } from "./rpc.js";

const connections: Record<string, Connection> = {};

export function getConnection(cluster: Cluster): Connection {
  if (!connections[cluster]) {
    const rotator = getSolanaRpcRotator(cluster);

    // Provide a dummy URL since the fetch override will ignore it
    connections[cluster] = new Connection("https://dummy.solana.rpc", {
      fetch: async (url, options) => {
        return rotator.forward(options?.body as string | null, options?.method);
      },
    });
  }
  
  return connections[cluster];
}
