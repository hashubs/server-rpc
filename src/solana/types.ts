export type Cluster = "mainnet" | "testnet" | "devnet";

export interface Asset {
  type: "native" | "spl";
  mint: string;
  symbol: string | null;
  name: string | null;
  image: string | null;
  amount: number;
  decimals: number;
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
