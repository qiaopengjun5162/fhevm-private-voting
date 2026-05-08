"use client";

import { useState } from "react";
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
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Private Voting dApp</h1>
      <p className="text-muted-foreground">
        Confidential on-chain voting powered by Zama fhEVM.
      </p>

      <NetworkBanner network={network} />
      <WalletConnector {...wallet} />
      <ContractAddressInput onAddressChange={setContractAddress} />
      <VotingMetadata
        state={votingState.state}
        phase={votingState.phase}
        isLoading={votingState.isLoading}
        error={votingState.error}
        onRetry={votingState.refresh}
      />
      <VoteForm
        phase={votingState.phase}
        hasVoted={votingState.state?.hasVoted ?? false}
        options={votingState.state?.options ?? []}
        contract={contract}
        fhe={fhe}
        network={network}
      />
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
