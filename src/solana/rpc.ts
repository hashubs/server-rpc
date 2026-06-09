import { RpcRotator } from "../utils/rpc";
import { Cluster } from "./types";

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
    "https://api.mainnet-beta.solana.com",
    "https://rpc.solana.nightly.app",
    "https://solana-rpc.publicnode.com",
    "https://solana.a.exodus.io",
    "https://solana-mainnet.phantom.app/YBPpkkN4g91xDiAnTE9r0RcMkjg0sKUIWvAfoFVJ",
    "https://api.ldd711.com/api/plug/v1/web3-wallet/web3wallet/unify/proxy-node/rpc/SOL",
    "https://api.zan.top/node/v1/solana/mainnet/daa3ee76ef2a41d88ef467e942beed1a",
    "https://mainnet.helius-rpc.com/?api-key=dc5df571-984b-4b0a-8af8-70d47bdbc2b9",
    "https://mainnet.helius-rpc.com/?api-key=22251fe5-940d-4eaf-95ce-8cd3c89d2048",
    "https://mainnet.helius-rpc.com/?api-key=079c7d71-e4c0-429d-a2df-19f34f8babf1",
    "https://mainnet.helius-rpc.com/?api-key=ffad90b6-a639-41db-bac0-627c1b288afc",
    "https://mainnet.helius-rpc.com/?api-key=8011ce71-29f1-44c5-9a5e-dcbebb4ccf70",
    "https://mainnet.helius-rpc.com/?api-key=849124e1-f6d5-4687-9643-34580e34858d",
    "https://mainnet.helius-rpc.com/?api-key=f5a9f099-86cc-41eb-b265-9ac43d2f5a7c",
    "https://mainnet.helius-rpc.com/?api-key=f2985653-d7a5-4658-ac79-3da92088c6b5",
    "https://mainnet.helius-rpc.com/?api-key=49ff8751-485e-4241-b9db-8baee42781cb",
    "https://mainnet.helius-rpc.com/?api-key=9242a0b0-534f-4677-ae38-e68efd10b1ee",
  ],
  testnet: [
    "https://api.testnet.solana.com",
    "https://api.zan.top/node/v1/solana/testnet/daa3ee76ef2a41d88ef467e942beed1a",
  ],
  devnet: [
    "https://api.devnet.solana.com",
    "https://devnet.helius-rpc.com/?api-key=dc5df571-984b-4b0a-8af8-70d47bdbc2b9",
    "https://devnet.helius-rpc.com/?api-key=22251fe5-940d-4eaf-95ce-8cd3c89d2048",
    "https://devnet.helius-rpc.com/?api-key=079c7d71-e4c0-429d-a2df-19f34f8babf1",
    "https://devnet.helius-rpc.com/?api-key=ffad90b6-a639-41db-bac0-627c1b288afc",
    "https://devnet.helius-rpc.com/?api-key=8011ce71-29f1-44c5-9a5e-dcbebb4ccf70",
    "https://devnet.helius-rpc.com/?api-key=849124e1-f6d5-4687-9643-34580e34858d",
    "https://devnet.helius-rpc.com/?api-key=f5a9f099-86cc-41eb-b265-9ac43d2f5a7c",
    "https://devnet.helius-rpc.com/?api-key=f2985653-d7a5-4658-ac79-3da92088c6b5",
    "https://devnet.helius-rpc.com/?api-key=49ff8751-485e-4241-b9db-8baee42781cb",
    "https://devnet.helius-rpc.com/?api-key=9242a0b0-534f-4677-ae38-e68efd10b1ee",
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
