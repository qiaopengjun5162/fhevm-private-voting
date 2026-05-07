"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import type { UseWalletReturn } from "@/hooks/useWallet";

type WalletConnectorProps = UseWalletReturn;

export function WalletConnector({
  account,
  isConnecting,
  error,
  connect,
  disconnect,
}: WalletConnectorProps) {
  const ethereumAvailable = typeof window !== "undefined" && !!window.ethereum;

  if (!ethereumAvailable) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          MetaMask is not installed. Please install MetaMask to interact with this dApp.
        </AlertDescription>
      </Alert>
    );
  }

  if (error && !account) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={connect} variant="outline">
          Retry Connection
        </Button>
      </div>
    );
  }

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm" title={account}>
          {truncateAddress(account)}
        </span>
        <Button variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={connect} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    </div>
  );
}
