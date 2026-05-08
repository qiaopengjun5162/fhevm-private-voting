"use client";

import type { VotingPhase } from "@/lib/utils";

interface PhaseBadgeProps {
  phase: VotingPhase | null;
}

const PHASE_CONFIG: Record<VotingPhase, { label: string; className: string }> = {
  before_start: {
    label: "Not Started",
    className: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
  },
  live: {
    label: "Voting Live",
    className: "border-primary/50 text-primary bg-primary/10",
  },
  ended: {
    label: "Voting Ended",
    className: "border-destructive/30 text-destructive bg-destructive/5",
  },
  results_published: {
    label: "Results Published",
    className: "border-green-500/30 text-green-400 bg-green-500/5",
  },
};

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  if (!phase) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-muted-foreground/20 text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
        Loading...
      </span>
    );
  }

  const config = PHASE_CONFIG[phase];
  const isLive = phase === "live";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      {isLive ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      )}
      {config.label}
    </span>
  );
}
