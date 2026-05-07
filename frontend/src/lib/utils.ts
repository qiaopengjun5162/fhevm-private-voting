import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(seconds: bigint | number): string {
  const ts = typeof seconds === "bigint" ? Number(seconds) : seconds;
  return new Date(ts * 1000).toLocaleString();
}

export type VotingPhase = "before_start" | "live" | "ended" | "results_published";

export function computePhase(
  startTime: bigint,
  endTime: bigint,
  resultsPublished: boolean
): VotingPhase {
  const now = Math.floor(Date.now() / 1000);
  if (resultsPublished) return "results_published";
  if (now < Number(startTime)) return "before_start";
  if (now < Number(endTime)) return "live";
  return "ended";
}
