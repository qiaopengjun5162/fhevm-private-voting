"use client";

import { Badge } from "@/components/ui/badge";
import type { VotingPhase } from "@/lib/utils";

interface PhaseBadgeProps {
  phase: VotingPhase | null;
}

const PHASE_CONFIG: Record<VotingPhase, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  before_start: { label: "Not Started", variant: "secondary" },
  live: { label: "Voting Live", variant: "default" },
  ended: { label: "Voting Ended", variant: "destructive" },
  results_published: { label: "Results Published", variant: "outline" },
};

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  if (!phase) {
    return <Badge variant="secondary">Loading...</Badge>;
  }

  const config = PHASE_CONFIG[phase];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
