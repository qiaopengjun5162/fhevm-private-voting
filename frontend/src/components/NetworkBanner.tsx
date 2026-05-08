"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-react";
import type { NetworkInfo } from "@/types";

interface NetworkBannerProps {
  network: NetworkInfo;
}

export function NetworkBanner({ network }: NetworkBannerProps) {
  if (!network.chainId) return null;

  const switchToSepolia = async () => {
    try {
      await window.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (e) {
      console.error("Failed to switch network:", e);
    }
  };

  if (network.isLocalhost) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
        <WifiOff className="w-4 h-4 text-yellow-500" />
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
          Read-Only
        </Badge>
        <span className="text-xs text-muted-foreground">
          Connected to localhost. Switch to Sepolia for FHE encryption.
        </span>
      </div>
    );
  }

  if (network.isSepolia) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <Wifi className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Sepolia — Live</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-destructive/20 bg-destructive/5">
      <span className="text-sm text-destructive">Unsupported network: {network.networkName}</span>
      <Button variant="outline" size="sm" onClick={switchToSepolia}>
        Switch to Sepolia
      </Button>
    </div>
  );
}
