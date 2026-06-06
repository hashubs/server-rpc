import { RpcRotator } from "../utils/rpc.js";
import { Cluster } from "./types.js";

const TATUM_API_KEYS = [
  "t-6544d31fe55e20001c0bda90-5e5e9243bbd640ea81ab734c",
  "t-xxxxxxxxxxxxxxxxxxxxxxxx-yyyyyyyyyyyyyyyyyyyyyyyy",
  "t-xxxxxxxxxxxxxxxxxxxxxxxx-zzzzzzzzzzzzzzzzzzzzzzzz",
];

const TATUM_URLS = new Set([
  "https://solana-mainnet.gateway.tatum.io",
  "https://solana-devnet.gateway.tatum.io",
]);

const SOLANA_RPCS: Record<Cluster, string[]> = {
  mainnet: [
    "https://solana-rpc.publicnode.com",
    "https://api.zan.top/node/v1/solana/mainnet/daa3ee76ef2a41d88ef467e942beed1a",
    "https://mainnet.helius-rpc.com/?api-key=dc5df571-984b-4b0a-8af8-70d47bdbc2b9",
    "https://solana-mainnet.gateway.tatum.io",
    "https://solana.a.exodus.io",
    "https://solana-mainnet.phantom.app/YBPpkkN4g91xDiAnTE9r0RcMkjg0sKUIWvAfoFVJ",
    "https://api.ldd711.com/api/plug/v1/web3-wallet/web3wallet/unify/proxy-node/rpc/SOL",
  ],
  testnet: [
    "https://solana-testnet-rpc.publicnode.com",
    "https://api.zan.top/node/v1/solana/testnet/daa3ee76ef2a41d88ef467e942beed1a",
  ],
  devnet: [
    "https://devnet.helius-rpc.com/?api-key=dc5df571-984b-4b0a-8af8-70d47bdbc2b9",
    "https://solana-devnet.gateway.tatum.io",
    "https://api.zan.top/node/v1/solana/devnet/daa3ee76ef2a41d88ef467e942beed1a",
  ],
};

const rotators: Record<string, RpcRotator> = {};

export function getSolanaRpcRotator(cluster: Cluster): RpcRotator {
  if (!rotators[cluster]) {
    rotators[cluster] = new RpcRotator({
      urls: SOLANA_RPCS[cluster] || [],
      specialUrls: TATUM_URLS,
      apiKeys: TATUM_API_KEYS,
      apiKeyHeaderName: "x-api-key",
    });
  }
  return rotators[cluster];
}
