"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <Alert variant="default" className="border-yellow-500 bg-yellow-50">
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 mb-2">
          Read-Only Mode
        </Badge>
        <AlertDescription>
          Connected to localhost. FHE encryption is not available. Switch to Sepolia for full
          functionality.
        </AlertDescription>
      </Alert>
    );
  }

  if (network.isSepolia) {
    return (
      <Alert variant="default" className="border-green-500 bg-green-50">
        <Badge variant="outline" className="border-green-500 text-green-700">
          Sepolia — Full Mode
        </Badge>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between">
        <span>Unsupported network: {network.networkName}. Please switch to Sepolia.</span>
        <Button variant="outline" size="sm" onClick={switchToSepolia}>
          Switch to Sepolia
        </Button>
      </AlertDescription>
    </Alert>
  );
}
