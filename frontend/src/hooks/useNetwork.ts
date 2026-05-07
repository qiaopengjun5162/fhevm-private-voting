"use client";

import { useEffect, useState } from "react";
import type { BrowserProvider } from "ethers";
import { CHAIN_IDS } from "@/lib/config";
import type { NetworkInfo } from "@/types";

export function useNetwork(provider: BrowserProvider | null): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    chainId: null,
    isLocalhost: false,
    isSepolia: false,
    isReadOnly: true,
    networkName: "Not connected",
  });

  useEffect(() => {
    if (!provider) {
      setNetworkInfo({
        chainId: null,
        isLocalhost: false,
        isSepolia: false,
        isReadOnly: true,
        networkName: "Not connected",
      });
      return;
    }

    let cancelled = false;

    provider
      .getNetwork()
      .then((network) => {
        if (cancelled) return;
        const chainId = network.chainId;
        const isLocalhost = chainId === CHAIN_IDS.localhost;
        const isSepolia = chainId === CHAIN_IDS.sepolia;

        let networkName: string;
        let isReadOnly: boolean;

        if (isLocalhost) {
          networkName = "Localhost";
          isReadOnly = true;
        } else if (isSepolia) {
          networkName = "Sepolia";
          isReadOnly = false;
        } else {
          networkName = `Unknown (${chainId})`;
          isReadOnly = true;
        }

        setNetworkInfo({ chainId, isLocalhost, isSepolia, isReadOnly, networkName });
      })
      .catch(() => {
        if (!cancelled) {
          setNetworkInfo({
            chainId: null,
            isLocalhost: false,
            isSepolia: false,
            isReadOnly: true,
            networkName: "Error fetching network",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [provider]);

  return networkInfo;
}
