"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Contract } from "ethers";
import { computePhase } from "@/lib/utils";
import { POLL_INTERVAL_MS } from "@/lib/config";
import type { VotingPhase, VotingState } from "@/types";

interface UseVotingStateReturn {
  state: VotingState | null;
  phase: VotingPhase | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useVotingState(contract: Contract | null, account: string | null): UseVotingStateReturn {
  const [state, setState] = useState<VotingState | null>(null);
  const [phase, setPhase] = useState<VotingPhase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const refresh = useCallback(async () => {
    if (!contract) {
      setState(null);
      setPhase(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [title, options, startTime, endTime, resultsPublished, owner, hasVoted, optionCount] = (await Promise.all([
        contract.title(),
        contract.getOptions(),
        contract.startTime(),
        contract.endTime(),
        contract.resultsPublished(),
        contract.owner(),
        account ? contract.hasVoted(account) : Promise.resolve(false),
        contract.optionCount(),
      ])) as [string, string[], bigint, bigint, boolean, string, boolean, bigint];

      const count = Number(optionCount);
      const tallies: string[] = [];

      if (resultsPublished) {
        for (let i = 0; i < count; i++) {
          try {
            const tally = await contract.getEncryptedTally(i);
            tallies.push(tally);
          } catch {
            tallies.push("");
          }
        }
      }

      const currentPhase = computePhase(startTime, endTime, resultsPublished);

      setState({
        title,
        options,
        startTime,
        endTime,
        resultsPublished,
        owner: owner.toLowerCase(),
        hasVoted,
        encryptedTallies: tallies,
      });
      setPhase(currentPhase);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load voting data";
      setError(message);
      setState(null);
      setPhase(null);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account]);

  refreshRef.current = refresh;

  // Fetch on contract/account change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling
  useEffect(() => {
    if (!contract) return;
    const interval = setInterval(() => {
      refreshRef.current();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [contract]);

  // Event listeners
  useEffect(() => {
    if (!contract) return;

    const onEvent = () => {
      refreshRef.current();
    };

    contract.on("VoteSubmitted", onEvent);
    contract.on("ResultsPublished", onEvent);
    contract.on("ResultAccessGranted", onEvent);

    return () => {
      contract.off("VoteSubmitted", onEvent);
      contract.off("ResultsPublished", onEvent);
      contract.off("ResultAccessGranted", onEvent);
    };
  }, [contract]);

  return { state, phase, isLoading, error, refresh };
}
