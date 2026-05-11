# Changelog

All notable changes to this project.

## 2026-05-11

### Fixed

- **Signer race condition** in `useWallet` — account/provider were set before `getSigner()` completed, creating a "fake
  connected" state when MetaMask was locked. Now `getSigner()` is awaited atomically, and failures reset state.
- **React #418 hydration mismatch** — `WalletConnector` checked `typeof window` during render, causing server/client DOM
  divergence. Added `mounted` guard in `WalletConnector` and top-level hydration guard in `page.tsx`.
- **Raw error display** — ethers.js error strings cluttered the UI. Replaced inline `Alert` boxes with `toast.error()`
  notifications from sonner for all transient user-action errors (vote, publish, grant, decrypt).
- **Voting state polling** — errors during polling no longer clear already-loaded state. `hasLoadedRef` preserves cached
  data so the UI stays functional when MetaMask temporarily locks.

### Changed

- `useVotingState` preserves state on polling errors instead of wiping the UI
- `VotingMetadata` shows polling errors as toasts instead of replacing the metadata card
- `WalletConnector` retry button removed; reconnect via main "Connect Wallet" button

### Docs

- Expanded Known Issues in CLAUDE.md with multi-wallet conflict details (SafePal confirmed), hydration guard pattern,
  signer race condition, and toast guidelines

## 2026-05-10

### Fixed

- **Multi-wallet extension conflict** — SafePal and other wallet extensions override `window.ethereum`, causing "wallet
  must has at least one account" errors and React hydration failures. Diagnosed via incognito mode isolation.
- **Etherscan API migration** — migrated from V1 to V2 API format for contract verification
- Pinned `@zama-fhe/relayer-sdk` to 0.4.3

### Added

- V2 deploy script for `PrivateVotingV2` (with `onlyOwner` access control)
- Etherscan `apiKey` reading from `.env`

### Docs

- Updated DEVELOPMENT.md with Etherscan V2 migration notes

## 2026-05-09

### Added

- "Why FHE Voting" comparison section in README (FHE vs commit-reveal vs TEE)
- Live demo link to Vercel deployment
- Bilingual video script for Zama bounty submission

### Docs

- DEVELOPMENT.md — full development journal
- Chinese README (README.zh-CN.md)

### Fixed

- Contract permission: `PrivateVotingV2` adds `onlyOwner` to `publishResults()` and `grantResultAccess()`
- License corrected to BSD-3-Clause-Clear
- All solhint, eslint, and prettier lint checks passing

## 2026-05-08

### Added

- Light/dark theme toggle with system preference detection (`next-themes`)
- Contract address display with copy-to-clipboard and bold highlight
- `viem` signTypedData for EIP-712 decryption authorization

### Fixed

- Vercel build: webpack fallback (Turbopack hangs), `ignoreBuildErrors` for TS `@/*` path resolution
- Wallet disconnect now properly revokes MetaMask permissions
- FHE relayer URL, COOP/COEP headers, checksum addresses
- EIP-712 type filtering for ethers.js v6 compatibility

### Changed

- Redesigned frontend with dark sci-fi FHE theme (glass morphism, gradient orbs, dot pattern)
- Background replaced with floating gradient orbs and subtle dot grid

## 2026-05-07

### Added

- Next.js 16 frontend with shadcn/ui + Tailwind CSS 4
- MetaMask wallet integration (`useWallet` hook)
- FHE encryption/decryption via `@zama-fhe/relayer-sdk` (`useFHE` hook)
- Voting state polling with contract event listeners (`useVotingState`)
- Full voting flow: connect → vote → publish → grant → decrypt
- Toast notifications for transient errors

### Fixed

- `.env` support with dotenv, private key + RPC URL configuration
- FHE SDK lazy-loading and Turbopack CSS resolution
- Unused imports and dead props removed

## 2026-05-06

### Added

- `PrivateVoting.sol` — FHE voting contract with encrypted ballots, homomorphic tallying, and decryption
- `FHECounter.sol` — template FHE counter contract
- Contract tests using fhevm mock environment
- Hardhat deployment scripts for localhost and Sepolia
- Hardhat CLI tasks for contract interaction
- TypeChain bindings for typed ethers.js v6 integration
