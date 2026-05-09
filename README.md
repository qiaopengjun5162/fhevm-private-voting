# FHE Private Voting dApp

[中文版](./README.zh-CN.md)

Confidential on-chain voting powered by [Zama fhEVM](https://www.zama.ai/fhevm) — Fully Homomorphic Encryption on
Ethereum. Votes are encrypted end-to-end, tallies are computed homomorphically, and results are only revealed after the
voting window closes.

## Architecture

```
fhevm-private-voting/
├── contracts/                  # Solidity contracts
│   ├── PrivateVoting.sol       # Main voting contract (FHE)
│   └── FHECounter.sol          # Template example
├── deploy/                     # Hardhat deploy scripts
├── test/                       # Contract tests (fhevm mock)
├── tasks/                      # Hardhat CLI tasks
└── frontend/                   # Next.js 16 + React 19
    └── src/
        ├── app/                # Pages & layout
        ├── components/         # UI components (shadcn/ui)
        ├── hooks/              # useWallet, useFHE, useVotingState, etc.
        └── lib/                # ABI, config, utils, types
```

## Why FHE Voting?

Traditional on-chain voting is fully transparent — every ballot is public. This enables vote buying, strategic voting,
and peer pressure. DAOs and shareholder governance need confidentiality, but without sacrificing verifiability.

| Approach                            | Limitations                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| Commit-reveal                       | Two transactions; voters can abort after seeing partial tally |
| TEE (Trusted Execution Environment) | Hardware trust assumption; side-channel attacks exist         |
| **FHE (this project)**              | Pure cryptography; single tx; no trusted hardware             |

With FHE: ballots are encrypted end-to-end, computation runs directly on ciphertext, and results are only decryptable
after the voting window closes. Not even the contract owner can peek at individual votes.

## How It Works

1. Deployer creates a voting with title, options, and time window
2. Voters submit **encrypted** ballots — their choice is never visible on-chain
3. Tallies accumulate via **homomorphic addition** (computation on encrypted data)
4. After the window closes, the owner publishes results
5. Authorized viewers decrypt the final tallies

## Live Demo

Frontend deployed on Vercel: [fhevm-private-voting-nine.vercel.app](https://fhevm-private-voting-nine.vercel.app/)

> Contract deployed on Sepolia testnet. Connect MetaMask (Sepolia), paste the deployed contract address, and interact
> with the full FHE voting flow.

## Quick Start

### Prerequisites

- Node.js >= 20, [Bun](https://bun.sh) (frontend)
- [MetaMask](https://metamask.io/) browser extension
- Sepolia ETH for gas (testnet)

### Install

```bash
# Root (contracts)
npm install

# Frontend
cd frontend && bun install
```

### Environment

```bash
cp .env.example .env
# Edit .env:
#   PRIVATE_KEY="0x..."          Your wallet private key
#   SEPOLIA_RPC_URL="https://..."  Alchemy/Infura RPC endpoint
#   ETHERSCAN_API_KEY="..."      Optional, for contract verification
```

### Local Development

```bash
# Terminal 1: Start Hardhat node
npm run chain

# Terminal 2: Deploy contracts
npm run deploy:localhost

# Terminal 3: Start frontend
cd frontend && bun dev
```

Localhost is **read-only** — FHE encryption/decryption is not available. Use Sepolia for full testing.

### Sepolia Deployment

```bash
# Deploy contracts
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

Then open `http://localhost:3000`, connect MetaMask (Sepolia), paste the deployed contract address.

### Testing Flow

1. **Deploy** → contract is created with a voting window
2. **Vote** → submit encrypted ballot via MetaMask (one vote per address)
3. **Wait** → voting window ends
4. **Publish** → owner clicks "Publish Results" in Owner Controls
5. **Grant** → owner grants decryption access to viewers
6. **Decrypt** → authorized viewers decrypt and see final tallies

## Commands

| Command                            | Description                                  |
| ---------------------------------- | -------------------------------------------- |
| `npm run compile`                  | Compile contracts + generate TypeChain types |
| `npm test`                         | Run contract tests (fhevm mock)              |
| `npm run chain`                    | Start local Hardhat node                     |
| `npm run deploy:localhost`         | Deploy to localhost                          |
| `npm run deploy:sepolia`           | Deploy to Sepolia                            |
| `npm run prettier:write`           | Format code                                  |
| `cd frontend && bun dev`           | Frontend dev server                          |
| `cd frontend && bunx tsc --noEmit` | Frontend type check                          |

## Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Smart Contracts | Solidity 0.8.27 + @fhevm/solidity  |
| FHE SDK         | @zama-fhe/relayer-sdk              |
| Frontend        | Next.js 16 + React 19 + TypeScript |
| Styling         | Tailwind CSS 4 + shadcn/ui         |
| Web3            | ethers.js v6                       |
| Dev Tools       | Hardhat + hardhat-deploy + Bun     |

## License

BSD-3-Clause-Clear — see [LICENSE](./LICENSE)
