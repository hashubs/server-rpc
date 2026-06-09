import { Connection, PublicKey } from "@solana/web3.js";
import { Metadata } from "./types";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

function getMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );
  return pda;
}

function parseMetadataAccount(
  buffer: Buffer,
): Metadata & { uri: string | null } {
  try {
    let offset = 65;
    const nameLen = buffer.readUInt32LE(offset);
    offset += 4;
    const name = buffer
      .toString("utf8", offset, offset + nameLen)
      .replace(/\0/g, "")
      .trim();
    offset += nameLen;

    const symbolLen = buffer.readUInt32LE(offset);
    offset += 4;
    const symbol = buffer
      .toString("utf8", offset, offset + symbolLen)
      .replace(/\0/g, "")
      .trim();
    offset += symbolLen;

    const uriLen = buffer.readUInt32LE(offset);
    offset += 4;
    const uri = buffer
      .toString("utf8", offset, offset + uriLen)
      .replace(/\0/g, "")
      .trim();

    return {
      name: name || null,
      symbol: symbol || null,
      image: null,
      uri: uri || null,
    };
  } catch (err) {
    return { name: null, symbol: null, image: null, uri: null };
  }
}

async function fetchImageFromUri(uri: string | null): Promise<string | null> {
  if (!uri || !uri.startsWith("http")) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(uri, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.image || null;
  } catch (e) {
    return null;
  }
}

export interface OnchainMetadataResult {
  name: string | null;
  symbol: string | null;
  uri: string | null;
  image: string | null;
}

export async function getOnchainMetadataMap(
  connection: Connection,
  mints: string[],
): Promise<Record<string, OnchainMetadataResult>> {
  if (mints.length === 0) return {};

  const pdas = mints.map((mint) => getMetadataPda(new PublicKey(mint)));
  const chunkSize = 100;
  const chunkPromises = [];

  for (let i = 0; i < pdas.length; i += chunkSize) {
    const chunk = pdas.slice(i, i + chunkSize);
    chunkPromises.push(connection.getMultipleAccountsInfo(chunk));
  }

  const chunkResults = await Promise.all(chunkPromises);
  const metadataAccounts = chunkResults.flat();

  const resultMap: Record<string, OnchainMetadataResult> = {};

  const processPromises = mints.map(async (mint, i) => {
    const metaAccount = metadataAccounts[i];
    let name: string | null = null;
    let symbol: string | null = null;
    let uri: string | null = null;
    let image: string | null = null;

    if (metaAccount && metaAccount.data) {
      const parsedMeta = parseMetadataAccount(metaAccount.data as Buffer);
      name = parsedMeta.name;
      symbol = parsedMeta.symbol;
      uri = parsedMeta.uri;
    }

    if (uri) {
      image = await fetchImageFromUri(uri);
    }

    resultMap[mint] = { name, symbol, uri, image };
  });

  await Promise.all(processPromises);
  return resultMap;
}
