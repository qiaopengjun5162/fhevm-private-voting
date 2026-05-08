export const CHAIN_IDS = {
  localhost: BigInt(31337),
  sepolia: BigInt(11155111),
} as const;

export const STORAGE_KEYS = {
  contractAddress: "private_voting_contract_address",
} as const;

export const DECRYPT_AUTH_DURATION_DAYS = 30;

export const POLL_INTERVAL_MS = 30_000;
