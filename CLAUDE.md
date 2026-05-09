# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FHE Private Voting dApp — confidential on-chain voting using Zama's fhEVM (Fully Homomorphic Encryption on Ethereum).
Based on the `fhevm-hardhat-template`. Votes are encrypted, tallies are computed homomorphically, and results are only
revealed after the voting window closes.

## Commands

### Contract development (root)

```bash
# Install dependencies first
npm install

# Compile contracts (also runs typechain post-compile)
npm run compile

# Force recompile (use after clean or when artifacts are missing)
npx hardhat compile --force

# Run all tests (local fhevm mock)
npm test

# Run a single test file
npx hardhat test test/PrivateVoting.ts

# Clean all build artifacts
npx hardhat clean

# Type check only
npm run build:ts
```

### Frontend

Uses [Bun](https://bun.sh) in `frontend/` for faster installs and script startup (`packageManager` is pinned in
`frontend/package.json`).

```bash
cd frontend && bun install

# Dev server (hot reload)
cd frontend && bun run dev

# Type check
cd frontend && bunx tsc --noEmit

# Production build
cd frontend && bun run build
```

### Global

```bash
# Lint everything
npm run lint

# Format code
npm run prettier:write
```

## Architecture

### FHE primitives (fhEVM)

Contracts use Zama's FHE library (`@fhevm/solidity`). Key types: `ebool`, `euint8`, `euint32`, `externalEuint*`.

- **Encrypted inputs**: Users encrypt values off-chain via
  `fhevm.createEncryptedInput(contractAddr, userAddr).add8(value).encrypt()`, then pass `{handles, inputProof}` to the
  contract.
- **Homomorphic operations**: `FHE.add()`, `FHE.sub()`, `FHE.eq()`, `FHE.select(condition, trueVal, falseVal)` — all run
  on encrypted data.
- **Access control**: Encrypted values are not readable by default. `FHE.allowThis(value)` lets the contract itself
  operate on it. `FHE.allow(value, address)` grants decryption permission to a specific address.
- **Decryption**: Tests use `fhevm.userDecryptEuint(FhevmType.euint8, encryptedHandle, contractAddr, signer)` — only
  works when the signer has been granted access via `FHE.allow`.

### Contracts

- **`FHECounter.sol`** — Template example: encrypted counter with `increment` and `decrement` using `euint32`.
- **`PrivateVoting.sol`** — Original voting contract. Note: `publishResults()` and `grantResultAccess()` lack access
  control — anyone can call them.
- **`PrivateVotingV2.sol`** — Fixed version with `onlyOwner` modifier on `publishResults()` and `grantResultAccess()`.
  Use this for new deployments.

### Testing

Tests use the fhevm **mock** environment (not a real fheVM node). Each test suite checks `fhevm.isMock` in `beforeEach`
and skips if false (e.g., on Sepolia). The encrypted input flow in tests: `fhevm.createEncryptedInput()` →
`.add8(value)` → `.encrypt()` → pass handles + proof to contract → wait for tx → `fhevm.userDecryptEuint()` to verify.

`FHECounterSepolia.ts` is the opposite: it runs **only** on a real network and skips if `fhevm.isMock` is true.

### Deployment

Uses `hardhat-deploy`. Scripts in `deploy/` are ordered by filename prefix (`02_deploy_voting.ts` runs after
`deploy.ts`). Each script exports a `DeployFunction` with a unique `id` and `tags`. The network determines where it
deploys (localhost, Sepolia).

**Environment variables (.env):**

Copy `.env.example` to `.env` and fill in real values. `.env` is gitignored. Priority: `process.env` > hardhat vars >
defaults.

Supports both **private key** (recommended) and **mnemonic**, plus direct RPC URL or Infura API key:

```bash
cp .env.example .env
# Edit .env — at minimum set PRIVATE_KEY and SEPOLIA_RPC_URL
# PRIVATE_KEY="0x..."          # Your wallet private key
# SEPOLIA_RPC_URL="https://..."  # Alchemy/Infura RPC endpoint
```

**Deploy commands:**

```bash
# Local Hardhat node
npm run chain                        # Terminal 1: start node
npm run deploy:localhost             # Terminal 2: deploy

# Sepolia testnet (requires .env with real mnemonic + Infura key)
npm run deploy:sepolia

# Verify contract on Etherscan
npm run verify:sepolia
```

### Hardhat tasks

Tasks in `tasks/` provide CLI interaction with contracts. `task:increment` and `task:decrement` for FHECounter;
`task:decrypt-count` reads the encrypted counter. Tasks require `fhevm.initializeCLIApi()` before FHE operations.

### TypeChain

Contract ABIs are auto-converted to typed ethers.js v6 bindings in `types/`. After compilation, `npm run typechain`
regenerates these. Import types as `import { PrivateVoting__factory } from "../types"`.

**Note:** `types/` is gitignored — generated on `npm run compile`. If `npx hardhat compile` says "Nothing to compile",
use `--force`.

### Frontend (Next.js 16)

Tech stack: Next.js 16 + React 19 + ethers.js v6 + shadcn/ui + Tailwind CSS 4 + @zama-fhe/relayer-sdk

```
frontend/src/
  app/
    layout.tsx          — Root layout with Geist font, Toaster
    page.tsx            — Main page, composes all components
  hooks/
    useWallet.ts        — MetaMask connect/disconnect/accountsChanged
    useNetwork.ts       — chain ID detection, read-only vs Sepolia
    useContract.ts      — ethers.js Contract instance from address + signer
    useVotingState.ts   — Fetches + polls voting metadata/phase
    useFHE.ts           — Lazy-loads @zama-fhe/relayer-sdk, encrypt/decrypt
  components/
    WalletConnector.tsx
    NetworkBanner.tsx
    ContractAddressInput.tsx
    VotingMetadata.tsx      — Title, options, timestamps, phase badge
    PhaseBadge.tsx
    VoteForm.tsx            — Radio selection + encrypt + submit tx
    OwnerPanel.tsx          — publishResults() + grantResultAccess()
    ResultsDisplay.tsx      — Decrypt tallies and show bar chart
  lib/
    abi.ts              — Full PrivateVoting ABI (hand-written for ethers v6)
    config.ts           — Chain IDs, relayer URL, storage keys, poll interval
    utils.ts            — cn(), truncateAddress(), formatTimestamp(), computePhase()
  types/
    index.ts            — VotingState, WalletState, NetworkInfo, EncryptResult
```

**FHE flow on Sepolia:**

1. User selects option → `useFHE.encryptVote(index)` → lazily loads `@zama-fhe/relayer-sdk/web`, calls
   `createEncryptedInput(contractAddr, userAddr).add8(index).encrypt()`
2. Returns `{handles, inputProof}` → passed to `contract.vote(handles[0], inputProof)`
3. Results decryption: `useFHE.decryptTally(handle)` → `generateKeypair()` → `createEIP712()` → `signer.signTypedData()`
   → `userDecrypt()`

**Network support:**

- **Localhost (Hardhat)**: Read-only contract interaction; FHE encryption/decryption not available. Mock encryption only
  works in tests.
- **Sepolia**: Full functionality via `@zama-fhe/relayer-sdk` + Zama's KMS relayer

### Vercel deployment

Frontend is deployed on Vercel. Production build uses webpack (`next build --webpack`) because Turbopack hangs
indefinitely. Vercel's built-in tsc cannot resolve `@/*` path aliases, so `ignoreBuildErrors: true` is set in
`next.config.ts` — webpack handles resolution correctly at build time.

### Known issues

**Multiple wallet extensions**: Having multiple browser wallet extensions (MetaMask + others) causes
`Cannot redefine property: ethereum` errors and hydration mismatches. Disable all wallet extensions except the one being
used.

**Localhost FHE limitation**: Local Hardhat node uses mock encryption — `title()`, `getOptions()`, etc. work, but
encrypted voting and decryption require Sepolia.

**Contract permission (V1)**: `PrivateVoting.sol` has no access control on `publishResults()` and `grantResultAccess()`
— anyone can call them. Use `PrivateVotingV2.sol` for new deployments.
