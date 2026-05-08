"use client";

import { useState } from "react";
import { Contract } from "ethers";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { VotingPhase, NetworkInfo, EncryptResult } from "@/types";
import type { UseFHEReturn } from "@/hooks/useFHE";

interface VoteFormProps {
  phase: VotingPhase | null;
  hasVoted: boolean;
  options: string[];
  contract: Contract | null;
  fhe: UseFHEReturn;
  network: NetworkInfo;
}

type VoteStatus = "idle" | "encrypting" | "signing" | "confirming" | "success" | "error";

const VOTE_STATUS_LABELS: Record<VoteStatus, string> = {
  idle: "",
  encrypting: "Encrypting vote...",
  signing: "Check MetaMask to confirm...",
  confirming: "Waiting for transaction confirmation...",
  success: "Vote submitted successfully!",
  error: "",
};

export function VoteForm({
  phase,
  hasVoted,
  options,
  contract,
  fhe,
  network,
}: VoteFormProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<VoteStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canVote = phase === "live" && !hasVoted;

  const handleSubmit = async () => {
    if (selectedIndex === null || !contract) return;

    setStatus("encrypting");
    setError(null);
    setTxHash(null);

    try {
      let encrypted: EncryptResult;

      if (network.isSepolia) {
        encrypted = await fhe.encryptVote(selectedIndex);
      } else {
        throw new Error("Voting is not available on this network.");
      }

      setStatus("signing");
      const tx = await contract.vote(encrypted.handles[0], encrypted.inputProof);

      setStatus("confirming");
      await tx.wait();

      setTxHash(tx.hash);
      setStatus("success");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Vote failed";
      if (message.includes("User rejected") || message.includes("denied")) {
        setError("Transaction rejected in wallet.");
      } else {
        setError(message);
      }
      setStatus("error");
    }
  };

  const isSubmitting = ["encrypting", "signing", "confirming"].includes(status);

  const disabledReason = (() => {
    if (!canVote) {
      if (phase === "before_start") return "Voting has not started yet.";
      if (phase === "ended") return "Voting has ended.";
      if (phase === "results_published") return "Results have already been published.";
      if (hasVoted) return "You have already voted.";
    }
    if (network.isReadOnly) return "FHE encryption is not available on this network.";
    if (!fhe.canUseFhe) return "Switch to Sepolia to cast an encrypted vote.";
    if (fhe.isInitializing) return "Initializing FHE SDK...";
    return null;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
        <CardDescription>
          {canVote
            ? "Select an option and submit your encrypted vote."
            : disabledReason}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {options.map((option, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                selectedIndex === i ? "border-primary bg-primary/5" : "hover:bg-muted"
              } ${!canVote ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="vote-option"
                value={i}
                checked={selectedIndex === i}
                onChange={() => canVote && setSelectedIndex(i)}
                disabled={!canVote}
                className="accent-primary"
              />
              <span className="text-sm font-medium">{option}</span>
            </label>
          ))}
        </div>

        {status === "success" && txHash && (
          <Alert className="mt-4 border-green-500 bg-green-50">
            <AlertDescription>
              Vote submitted!
              {network.isSepolia && (
                <>
                  {" "}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View on Etherscan
                  </a>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {fhe.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{fhe.error}</AlertDescription>
          </Alert>
        )}

        {status === "error" && error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={
            selectedIndex === null ||
            !canVote ||
            isSubmitting ||
            !fhe.canUseFhe ||
            fhe.isInitializing
          }
          className="w-full"
        >
          {isSubmitting ? VOTE_STATUS_LABELS[status] : "Submit Vote"}
        </Button>
      </CardFooter>
    </Card>
  );
}
