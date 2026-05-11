"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Wallet } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const [ethereumAvailable, setEthereumAvailable] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEthereumAvailable(typeof window !== "undefined" && !!window.ethereum);
  }, []);

  // Avoid hydration mismatch: render nothing until mounted
  if (!mounted) {
    return <div className="h-11" />;
  }

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
        <Button onClick={connect} variant="outline" className="w-full">
          <Loader2 className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  if (account) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-mono text-sm" title={account}>
              {truncateAddress(account)}
            </div>
            <div className="text-xs text-primary/70">Connected</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => disconnect()} className="text-muted-foreground hover:text-destructive" title="Disconnect wallet">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connect}
      disabled={isConnecting}
      className="w-full h-11 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,180,255,0.3)]"
    >
      {isConnecting ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </span>
      )}
    </Button>
  );
}
