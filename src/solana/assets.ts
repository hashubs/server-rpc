import { Connection, PublicKey } from "@solana/web3.js";
import { Asset, Cluster } from "./types";
import { getOnchainMetadataMap, OnchainMetadataResult } from "./metadata";
import {
  getSolflareMetadataMap,
  getSolflareNativeSol,
  SolflareToken,
} from "./metadataFromSolflare";

export async function getWalletAssets(
  connection: Connection,
  walletAddress: string,
  options: {
    cluster?: Cluster;
  } = {},
): Promise<Asset[]> {
  const owner = new PublicKey(walletAddress);

  const [solBalance, tokenAccountsResponse] = await Promise.all([
    connection.getBalance(owner),
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    }),
  ]);

  const validTokenAccounts = tokenAccountsResponse.value.filter((ta) => {
    const amount = ta.account.data.parsed.info.tokenAmount.uiAmount;
    return amount && amount > 0;
  });

  const mints = validTokenAccounts.map(
    (ta) => ta.account.data.parsed.info.mint,
  );

  const isMainnet =
    options.cluster !== "devnet" && options.cluster !== "testnet";
  const fetchSolflare = isMainnet;

  const [onchainMap, solflareMap, solflareNative] = await Promise.all([
    validTokenAccounts.length > 0 ? getOnchainMetadataMap(connection, mints) : Promise.resolve({} as Record<string, OnchainMetadataResult>),
    (validTokenAccounts.length > 0 && fetchSolflare) ? getSolflareMetadataMap(mints) : Promise.resolve({} as Record<string, SolflareToken>),
    (solBalance > 0 && fetchSolflare) ? getSolflareNativeSol() : Promise.resolve(null)
  ]);

  const assets: Asset[] = [];

  if (solBalance > 0) {
    assets.push({
      type: "native",
      mint: "So11111111111111111111111111111111111111112",
      amount: solBalance / 1e9,
      decimals: 9,
      name: "Solana",
      symbol: "SOL",
      image:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      verified: true,
      ...(solflareNative?.price?.usdPrice !== undefined
        ? { 
            usdPrice: solflareNative.price.usdPrice,
            ...(solflareNative.price.usdChange !== undefined ? { usdChange: solflareNative.price.usdChange } : {})
          }
        : {}),
    });
  }

  for (const ta of validTokenAccounts) {
    const info = ta.account.data.parsed.info;
    const mint = info.mint;

    const onchain = onchainMap[mint];
    const solflare = solflareMap[mint];

    assets.push({
      type: "spl-token",
      mint,
      amount: info.tokenAmount.uiAmount,
      decimals: info.tokenAmount.decimals,
      name: solflare?.name || onchain?.name || null,
      symbol: solflare?.symbol || onchain?.symbol || null,
      image: solflare?.imageUri || onchain?.image || null,
      verified: solflare?.verified || false,
      ...(solflare?.price?.usdPrice !== undefined
        ? { 
            usdPrice: solflare.price.usdPrice,
            ...(solflare.price.usdChange !== undefined ? { usdChange: solflare.price.usdChange } : {})
          }
        : {}),
    });
  }

  return assets;
}
