import { Connection, PublicKey } from "@solana/web3.js";
import { Metadata } from "./types.js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export function getMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

export function parseMetadataAccount(buffer: Buffer): Metadata & { uri: string | null } {
  try {
    // Basic Metaplex Token Metadata Layout parsing
    // 0: key
    // 1-32: update auth
    // 33-64: mint
    // 65: name length (u32)
    let offset = 65;
    const nameLen = buffer.readUInt32LE(offset);
    offset += 4;
    const name = buffer.toString("utf8", offset, offset + nameLen).replace(/\0/g, "").trim();
    offset += nameLen;

    const symbolLen = buffer.readUInt32LE(offset);
    offset += 4;
    const symbol = buffer.toString("utf8", offset, offset + symbolLen).replace(/\0/g, "").trim();
    offset += symbolLen;

    const uriLen = buffer.readUInt32LE(offset);
    offset += 4;
    const uri = buffer.toString("utf8", offset, offset + uriLen).replace(/\0/g, "").trim();

    return {
      name: name || null,
      symbol: symbol || null,
      image: null, // will be fetched from URI if needed
      uri: uri || null,
    };
  } catch (err) {
    return { name: null, symbol: null, image: null, uri: null };
  }
}
