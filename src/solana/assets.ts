import { Connection, PublicKey } from "@solana/web3.js";
import { Asset } from "./types.js";
import { getMetadataPda, parseMetadataAccount } from "./metadata.js";

export async function getWalletAssets(connection: Connection, walletAddress: string): Promise<Asset[]> {
  const owner = new PublicKey(walletAddress);

  // 1. Get SOL Balance
  const solBalance = await connection.getBalance(owner);
  
  // 2. Get SPL Token Accounts
  const tokenAccountsResponse = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });

  const assets: Asset[] = [];

  // Add Native SOL if balance > 0
  if (solBalance > 0) {
    assets.push({
      type: "native",
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Solana",
      image: null,
      amount: solBalance / 1e9,
      decimals: 9,
    });
  }

  // Filter out zero-balance token accounts and build list
  const validTokenAccounts = tokenAccountsResponse.value.filter((ta) => {
    const amount = ta.account.data.parsed.info.tokenAmount.uiAmount;
    return amount && amount > 0;
  });

  if (validTokenAccounts.length === 0) {
    return assets;
  }

  // 3. Fetch Metadata for SPL Tokens
  const mints = validTokenAccounts.map((ta) => new PublicKey(ta.account.data.parsed.info.mint));
  const pdas = mints.map((mint) => getMetadataPda(mint));
  
  // Fetch all metadata accounts in chunks (RPC limit is 100 pubkeys per call)
  const chunkSize = 100;
  const chunkPromises = [];

  for (let i = 0; i < pdas.length; i += chunkSize) {
    const chunk = pdas.slice(i, i + chunkSize);
    chunkPromises.push(connection.getMultipleAccountsInfo(chunk));
  }

  // Jalankan semua request chunk secara bersamaan agar jauh lebih cepat
  const chunkResults = await Promise.all(chunkPromises);
  const metadataAccounts = chunkResults.flat();

  for (let i = 0; i < validTokenAccounts.length; i++) {
    const ta = validTokenAccounts[i];
    const info = ta.account.data.parsed.info;
    const metaAccount = metadataAccounts[i];

    let name: string | null = null;
    let symbol: string | null = null;
    // Note: We skip fetching JSON URI for images in this v1 to keep latency low,
    // as fetching off-chain URIs per token can be very slow.
    let image: string | null = null; 

    if (metaAccount && metaAccount.data) {
      const parsedMeta = parseMetadataAccount(metaAccount.data as Buffer);
      name = parsedMeta.name;
      symbol = parsedMeta.symbol;
    }

    assets.push({
      type: "spl",
      mint: info.mint,
      symbol,
      name,
      image,
      amount: info.tokenAmount.uiAmount,
      decimals: info.tokenAmount.decimals,
    });
  }

  return assets;
}
