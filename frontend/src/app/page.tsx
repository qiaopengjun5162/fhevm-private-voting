"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useWallet } from "@/hooks/useWallet";
import { useNetwork } from "@/hooks/useNetwork";
import { useContract } from "@/hooks/useContract";
import { useVotingState } from "@/hooks/useVotingState";
import { useFHE } from "@/hooks/useFHE";

import { NetworkBanner } from "@/components/NetworkBanner";
import { WalletConnector } from "@/components/WalletConnector";
import { ContractAddressInput } from "@/components/ContractAddressInput";
import { VotingMetadata } from "@/components/VotingMetadata";
import { VoteForm } from "@/components/VoteForm";
import { OwnerPanel } from "@/components/OwnerPanel";
import { ResultsDisplay } from "@/components/ResultsDisplay";

export default function HomePage() {
  const wallet = useWallet();
  const network = useNetwork(wallet.provider);
  const { theme, setTheme } = useTheme();
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const contract = useContract(contractAddress, wallet.signer ?? wallet.provider);
  const votingState = useVotingState(contract, wallet.account);
  const fhe = useFHE(
    wallet.provider,
    wallet.signer,
    contractAddress,
    network,
    wallet.account
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto space-y-5 pb-16">
      {/* Header */}
      <div className="text-center space-y-3 pt-8 md:pt-12">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-4 right-4 p-2 rounded-full glass hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight animate-text-shimmer">
          Private Voting
        </h1>
        <p className="text-muted-foreground text-lg">
          Confidential on-chain voting powered by Zama fhEVM
        </p>
      </div>

      {/* Connection Bar */}
      <div className="glass-glow rounded-2xl px-5 py-4 space-y-3">
        <NetworkBanner network={network} />
        <WalletConnector {...wallet} />
        <ContractAddressInput onAddressChange={setContractAddress} />
      </div>

      {/* Voting Metadata */}
      <VotingMetadata
        state={votingState.state}
        phase={votingState.phase}
        isLoading={votingState.isLoading}
        error={votingState.error}
        onRetry={votingState.refresh}
      />

      {/* Vote Form */}
      <div className="glass-glow rounded-2xl p-5 transition-all duration-300">
        <VoteForm
          phase={votingState.phase}
          hasVoted={votingState.state?.hasVoted ?? false}
          options={votingState.state?.options ?? []}
          contract={contract}
          fhe={fhe}
          network={network}
        />
      </div>

      {/* Owner + Results */}
      <OwnerPanel
        contract={contract}
        state={votingState.state}
        phase={votingState.phase}
        account={wallet.account}
      />
      <ResultsDisplay
        state={votingState.state}
        phase={votingState.phase}
        fhe={fhe}
        network={network}
      />
    </div>
  );
}
