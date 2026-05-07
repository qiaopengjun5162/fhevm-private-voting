# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FHE Private Voting dApp — confidential on-chain voting using Zama's fhEVM (Fully Homomorphic Encryption on Ethereum). Based on the `fhevm-hardhat-template`. Votes are encrypted, tallies are computed homomorphically, and results are only revealed after the voting window closes.

## Commands

```bash
# Compile contracts (also runs typechain post-compile)
npm run compile

# Run all tests (local fhevm mock)
npm test

# Run tests on Sepolia
npm run test:sepolia

# Run a single test file
npx hardhat test test/PrivateVoting.ts

# Lint everything (Solidity, TypeScript, Prettier)
npm run lint

# Format code
npm run prettier:write

# Start a local Hardhat node (no deploy)
npm run chain

# Deploy to localhost (requires a running node)
npm run deploy:localhost

# Deploy to Sepolia
npm run deploy:sepolia

# Generate TypeChain type bindings
npm run typechain

# Clean all build artifacts
npm run clean

# Set required config vars (MNEMONIC, INFURA_API_KEY, ETHERSCAN_API_KEY)
npx hardhat vars setup
```

## Architecture

### FHE primitives (fhEVM)

Contracts use Zama's FHE library (`@fhevm/solidity`). Key types: `ebool`, `euint8`, `euint32`, `externalEuint*`.

- **Encrypted inputs**: Users encrypt values off-chain via `fhevm.createEncryptedInput(contractAddr, userAddr).add8(value).encrypt()`, then pass `{handles, inputProof}` to the contract.
- **Homomorphic operations**: `FHE.add()`, `FHE.sub()`, `FHE.eq()`, `FHE.select(condition, trueVal, falseVal)` — all run on encrypted data.
- **Access control**: Encrypted values are not readable by default. `FHE.allowThis(value)` lets the contract itself operate on it. `FHE.allow(value, address)` grants decryption permission to a specific address.
- **Decryption**: Tests use `fhevm.userDecryptEuint(FhevmType.euint8, encryptedHandle, contractAddr, signer)` — only works when the signer has been granted access via `FHE.allow`.

### Contracts

- **`FHECounter.sol`** — Template example: encrypted counter with `increment` and `decrement` using `euint32`.
- **`PrivateVoting.sol`** — Main contract: confidential voting with up to `MAX_OPTIONS` (3) options. Users submit encrypted votes (0 to MAX_OPTIONS-1). Each vote loops through all options, uses `FHE.eq` + `FHE.select` to produce an encrypted 0 or 1, then `FHE.add` to tally homomorphically. Results can only be published after `endTime` via `publishResults()`, which grants the owner decryption access. `grantResultAccess(viewer)` extends decryption rights to others.

### Testing

Tests use the fhevm **mock** environment (not a real fheVM node). Each test suite checks `fhevm.isMock` in `beforeEach` and skips if false (e.g., on Sepolia). The encrypted input flow in tests: `fhevm.createEncryptedInput()` → `.add8(value)` → `.encrypt()` → pass handles + proof to contract → wait for tx → `fhevm.userDecryptEuint()` to verify.

`FHECounterSepolia.ts` is the opposite: it runs **only** on a real network and skips if `fhevm.isMock` is true.

### Deployment

Uses `hardhat-deploy`. Scripts in `deploy/` are ordered by filename prefix (`02_deploy_voting.ts` runs after `deploy.ts`). Each script exports a `DeployFunction` with a unique `id` and `tags`. The network determines where it deploys (localhost, Sepolia).

### Hardhat tasks

Tasks in `tasks/` provide CLI interaction with contracts. `task:increment` and `task:decrement` for FHECounter; `task:decrypt-count` reads the encrypted counter. Tasks require `fhevm.initializeCLIApi()` before FHE operations.

### TypeChain

Contract ABIs are auto-converted to typed ethers.js v6 bindings in `types/`. After compilation, `npm run typechain` regenerates these. Import types as `import { PrivateVoting__factory } from "../types"`.
