# Solana Asset Service v1

## Objective

Build a dedicated Solana asset service using Hono + Vercel.

This service exists because Cloudflare Worker should remain lightweight.

The service is responsible for:

* Get wallet SOL balance
* Get wallet SPL tokens
* Resolve token metadata
* Return normalized asset data

The Cloudflare Worker remains the public API gateway.

Architecture:

Extension
→ Cloudflare Worker
→ Solana Asset Service (Vercel)
→ Solana RPC
→ Metaplex Metadata
→ Cloudflare Worker
→ Extension

---

# Scope v1

Input:

Wallet Address

Output:

Complete wallet assets.

Example:

{
"address": "...",
"assets": [
{
"type": "native",
"mint": "So11111111111111111111111111111111111111112",
"symbol": "SOL",
"name": "Solana",
"image": null,
"amount": 1.23,
"decimals": 9
},
{
"type": "spl",
"mint": "...",
"symbol": "USDC",
"name": "USD Coin",
"image": "...",
"amount": 100,
"decimals": 6
}
]
}

---

# Dependencies

Install:

```bash
npm install hono
npm install @solana/web3.js
npm install @metaplex-foundation/mpl-token-metadata
npm install zod
```

Purpose:

hono

* API framework

@solana/web3.js

* Solana RPC
* PublicKey
* Connection
* Token account queries

@metaplex-foundation/mpl-token-metadata

* Metadata PDA
* Metadata account decoding

zod

* Request validation

---

# Folder Structure

src/

├── index.ts
│
├── routes/
│   └── wallet.ts
│
├── solana/
│   ├── client.ts
│   ├── assets.ts
│   ├── metadata.ts
│   └── types.ts
│
└── utils/
└── response.ts

Keep structure intentionally small.

Do not create folders for future chains yet.

---

# File Responsibilities

## src/index.ts

Application entry point.

Responsibilities:

* Create Hono app
* Register routes
* Export app

No business logic.

---

## src/routes/wallet.ts

HTTP layer only.

Responsibilities:

* Read address parameter
* Validate address
* Call asset service
* Return response

Must not:

* Query RPC
* Query metadata
* Parse token accounts

---

## src/solana/client.ts

Single Solana connection.

Responsibilities:

* Create Connection
* Export shared connection

Example:

const connection = new Connection(
process.env.SOLANA_RPC_URL
)

Every module uses this connection.

---

## src/solana/assets.ts

Main business logic.

Responsibilities:

* Get SOL balance
* Get SPL token accounts
* Normalize balances
* Call metadata service
* Merge final result

This is the core service file.

Expected flow:

wallet
↓
SOL balance
↓
token accounts
↓
mint list
↓
metadata lookup
↓
normalized assets

---

## src/solana/metadata.ts

Metadata responsibilities only.

Input:

mint address

Responsibilities:

* Find metadata PDA
* Fetch metadata account
* Decode metadata
* Extract:

  * name
  * symbol
  * uri

Optional:

* Fetch metadata JSON URI
* Extract image

Return:

{
	name,
	symbol,
	image
}

No wallet logic here.

---

## src/solana/types.ts

Shared interfaces.

Asset

Metadata

WalletAssetsResponse

Only types.

No logic.

---

## src/utils/response.ts

Response helpers.

Success:

{
	success: true,
	data: {}
}

Error:

{
	success: false,
	error: {}
}

All endpoints use same format.

---

# Endpoint

GET

/api/wallet/:address/assets

Example:

/api/wallet/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM/assets

---

# Validation

Validate:

* Address exists
* Valid Solana public key

Invalid:

{
	"success": false,
	"error": {
		"code": "INVALID_ADDRESS",
		"message": "Invalid Solana address"
	}
}

---

# Asset Model

Asset

{
	"type": "native" | "spl",
	"mint": string,
	"symbol": string | null,
	"name": string | null,
	"image": string | null,
	"amount": number,
	"decimals": number
}

---

# Business Flow

1. Receive wallet address
2. Validate address
3. Get SOL balance
4. Get SPL token accounts
5. Extract mint addresses
6. Resolve metadata for each mint
7. Merge balances + metadata
8. Return normalized assets

---

# Environment Variables

SOLANA_RPC_URL=

Example:

SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

RPC endpoint must come from environment variables.

Never hardcode RPC URLs.

---

# Future Expansion

When Aptos is needed:

src/

├── solana/
└── aptos/

When Sui is needed:

src/

├── solana/
├── aptos/
└── sui/

Do not create these modules now.

Only create them when implementation starts.

---

# Design Rules

1. One shared Solana connection.
2. No RPC calls inside routes.
3. No metadata logic inside routes.
4. Metadata logic isolated in metadata.ts.
5. Asset aggregation isolated in assets.ts.
6. Every file should have one responsibility.
7. Optimize for readability and debugging.
8. Keep v1 focused on wallet asset discovery only.

Current goal:

Wallet Address
→ Assets
→ Metadata
→ Normalized JSON

Nothing else.
