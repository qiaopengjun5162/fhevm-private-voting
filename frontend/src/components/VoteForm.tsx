"use client";

import { useState } from "react";
import { Contract } from "ethers";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, ShieldCheck } from "lucide-react";
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
  confirming: "Waiting for confirmation...",
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
    <div>
      <div className="flex items-center gap-3 mb-4">
        {canVote ? (
          <Shield className="w-5 h-5 text-primary animate-glow-pulse" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <h3 className="text-lg font-semibold">Cast Your Vote</h3>
          <p className="text-sm text-muted-foreground">
            {canVote
              ? "Select an option and submit your encrypted vote."
              : disabledReason}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {options.map((option, i) => (
          <label
            key={i}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
              selectedIndex === i
                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,180,255,0.1)]"
                : "border-border hover:border-primary/30 hover:bg-muted/50"
            } ${!canVote ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="vote-option"
              value={i}
              checked={selectedIndex === i}
              onChange={() => canVote && setSelectedIndex(i)}
              disabled={!canVote}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium">{option}</span>
            {selectedIndex === i && (
              <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            )}
          </label>
        ))}
      </div>

      {isSubmitting && (
        <div className="flex items-center justify-center gap-3 py-4 mb-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <Shield className="absolute inset-0 m-auto w-4 h-4 text-primary animate-encrypt-spin" />
          </div>
          <span className="text-sm text-muted-foreground">{VOTE_STATUS_LABELS[status]}</span>
        </div>
      )}

      {status === "success" && txHash && (
        <Alert className="mb-4 border-green-500/30 bg-green-500/10">
          <AlertDescription>
            Vote submitted!
            {network.isSepolia && (
              <>
                {" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  View on Etherscan
                </a>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {fhe.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{fhe.error}</AlertDescription>
        </Alert>
      )}

      {status === "error" && error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={
          selectedIndex === null ||
          !canVote ||
          isSubmitting ||
          !fhe.canUseFhe ||
          fhe.isInitializing
        }
        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,180,255,0.3)] disabled:hover:shadow-none"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {VOTE_STATUS_LABELS[status]}
          </span>
        ) : (
          "Submit Vote"
        )}
      </Button>
    </div>
  );
}
