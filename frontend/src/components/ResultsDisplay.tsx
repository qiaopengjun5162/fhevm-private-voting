"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { VotingPhase, VotingState, NetworkInfo } from "@/types";
import type { UseFHEReturn } from "@/hooks/useFHE";

interface ResultsDisplayProps {
  state: VotingState | null;
  phase: VotingPhase | null;
  fhe: UseFHEReturn;
  network: NetworkInfo;
}

export function ResultsDisplay({
  state,
  phase,
  fhe,
  network,
}: ResultsDisplayProps) {
  const [decrypting, setDecrypting] = useState(false);
  const [results, setResults] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (phase !== "results_published") return null;
  if (!state) return null;

  const handleDecrypt = async () => {
    setDecrypting(true);
    setError(null);
    setResults(null);

    const n = Math.max(state.options.length, state.encryptedTallies.length);
    const decryptedResults: number[] = [];
    const failures: string[] = [];

    for (let i = 0; i < n; i++) {
      const label = state.options[i] ?? `Option ${i + 1}`;
      try {
        if (network.isSepolia && fhe.canUseFhe) {
          const handle = state.encryptedTallies[i];
          if (!handle) {
            decryptedResults.push(0);
            continue;
          }
          const count = await fhe.decryptTally(handle);
          decryptedResults.push(count);
        } else {
          decryptedResults.push(0);
        }
      } catch (e) {
        decryptedResults.push(0);
        failures.push(`${label}: ${e instanceof Error ? e.message : "decryption failed"}`);
      }
    }

    if (failures.length > 0) {
      setError(failures.join(" · "));
    }

    setResults(decryptedResults);
    setDecrypting(false);
  };

  const maxVotes = results ? Math.max(...results, 1) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>
          {results
            ? "Decrypted vote tallies per option."
            : network.isLocalhost
            ? "On localhost, tallies cannot be decrypted. Raw handles are shown below."
            : "Decrypt tallies to view the final results."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Localhost: Show raw handles */}
        {network.isLocalhost && !results && (
          <div className="space-y-1 text-xs font-mono">
            {state.options.map((option, i) => (
              <div key={i}>
                <span className="text-muted-foreground">{option}:</span>{" "}
                {state.encryptedTallies[i] || "N/A"}
              </div>
            ))}
          </div>
        )}

        {/* Decrypted results */}
        {results && (
          <div className="space-y-3">
            {results.map((count, i) => {
              const label = state.options[i] ?? `Option ${i + 1}`;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{count} vote(s)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxVotes) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {fhe.error && (
          <Alert variant="destructive">
            <AlertDescription>{fhe.error}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!results && network.isSepolia && fhe.canUseFhe && (
          <Button onClick={handleDecrypt} disabled={decrypting || fhe.isInitializing}>
            {decrypting || fhe.isInitializing ? "Decrypting..." : "Decrypt Results"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
