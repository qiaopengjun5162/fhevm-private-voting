# Contributing

## Prerequisites

- Node.js >= 20
- [Bun](https://bun.sh) (frontend package manager and runtime)
- [MetaMask](https://metamask.io/) browser extension
- Sepolia ETH for gas (testnet)

## Setup

```bash
git clone https://github.com/qiaopengjun5162/fhevm-private-voting.git
cd fhevm-private-voting

# Root (contracts)
npm install

# Frontend
cd frontend && bun install
```

### Environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `PRIVATE_KEY` — your wallet private key
- `SEPOLIA_RPC_URL` — Alchemy or Infura RPC endpoint

## Development Workflow

### One-time checks before starting

**Disable other wallet extensions.** SafePal, OKX, Rabby, Coinbase, Auro, and Pallad all compete for `window.ethereum`.
Having more than one wallet extension enabled causes RPC errors and React hydration failures. Use incognito mode with
only MetaMask enabled for a clean environment.

### Local development

```bash
# Terminal 1: Hardhat node
npm run chain

# Terminal 2: Deploy
npm run deploy:localhost

# Terminal 3: Frontend
cd frontend && bun dev
```

Localhost is **read-only** — FHE encryption and decryption require Sepolia.

### Testing on Sepolia

```bash
npm run deploy:sepolia
npm run verify:sepolia
cd frontend && bun dev
```

Open `http://localhost:3000`, connect MetaMask (Sepolia network), paste the deployed contract address.

### Before committing

```bash
# Format
npm run prettier:write

# Type check
npm run build:ts
cd frontend && bunx tsc --noEmit

# Lint
npm run lint

# Tests
npm test
```

## Code Style

- Prettier for formatting. Run `npm run prettier:write` before committing.
- TypeScript strict mode. No `any` without good reason.
- No comments that describe WHAT the code does — only WHY when non-obvious.
- Three similar lines is better than a premature abstraction.
- Delete unused code; no re-exports, no `_` prefixed vars, no `// removed` comments.

### Web3-specific conventions

- **Never** access `window.ethereum` during React render. Use `useEffect` or event handlers.
- **Always** await `getSigner()` before setting wallet state — setting account/provider before signer is ready creates a
  "fake connected" state.
- Use `toast.error()` from sonner for transient user-action errors (vote, publish, grant, decrypt). Only use inline
  `Alert` for persistent initialization errors.
- Add a top-level `mounted` hydration guard in pages that depend on browser APIs.

## Commit Convention

```
<type>: <brief description>
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `ci`, `chore`

Keep commits focused — one logical change per commit.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for the full architecture overview, command reference, and known issues.
