"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PhaseBadge } from "@/components/PhaseBadge";
import { formatTimestamp, truncateAddress } from "@/lib/utils";
import type { VotingPhase, VotingState } from "@/types";

interface VotingMetadataProps {
  state: VotingState | null;
  phase: VotingPhase | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

function SkeletonLine({ width }: { width: string }) {
  return <div className={`h-4 bg-muted rounded animate-pulse ${width}`} />;
}

export function VotingMetadata({
  state,
  phase,
  isLoading,
  error,
  onRetry,
}: VotingMetadataProps) {
  const prevErrorRef = useRef(error);

  useEffect(() => {
    // Show toast when polling error occurs (state already loaded)
    if (error && state && error !== prevErrorRef.current) {
      toast.error(error);
    }
    prevErrorRef.current = error;
  }, [error, state]);

  if (isLoading && !state) {
    return (
      <Card>
        <CardHeader>
          <SkeletonLine width="w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error && !state) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        {onRetry && (
          <CardFooter>
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voting Details</CardTitle>
          <CardDescription>Enter a contract address to load voting information.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{state.title}</CardTitle>
          <PhaseBadge phase={phase} />
        </div>
        <CardDescription>
          Owner: {truncateAddress(state.owner)}
          {state.hasVoted && (
            <span className="ml-2 text-green-600 font-medium">You have voted</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 list-disc list-inside">
          {state.options.map((option, i) => (
            <li key={i} className="text-sm">
              {option}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-sm text-muted-foreground">
        <p>Start: {formatTimestamp(state.startTime)}</p>
        <p>End: {formatTimestamp(state.endTime)}</p>
      </CardFooter>
    </Card>
  );
}
