export type Cluster = "mainnet" | "testnet" | "devnet";

export interface Asset {
  type: "native" | "spl-token";
  mint: string;
  symbol: string | null;
  name: string | null;
  image: string | null;
  amount: number;
  decimals: number;
  verified?: boolean;
  usdPrice?: number;
  usdChange?: number;
}

export interface Metadata {
  name: string | null;
  symbol: string | null;
  image: string | null;
}

export interface WalletAssetsResponse {
  address: string;
  assets: Asset[];
}
