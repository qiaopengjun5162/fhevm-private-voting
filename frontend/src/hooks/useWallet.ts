"use client";

import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

function getEthereum() {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export interface UseWalletReturn {
  account: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): UseWalletReturn {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setError(null);
  }, []);

  const handleAccountsChanged = useCallback(
    (accounts: unknown) => {
      const accs = accounts as string[];
      if (!accs || accs.length === 0) {
        resetState();
      } else if (accs[0] !== account) {
        const eth = getEthereum();
        if (eth) {
          const p = new BrowserProvider(eth);
          setProvider(p);
          setAccount(accs[0]);
          p.getSigner().then(setSigner).catch(console.error);
        }
      }
    },
    [account, resetState]
  );

  const handleChainChanged = useCallback(() => {
    // Force a page reload on network change to reset all contract state
    window.location.reload();
  }, []);

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) {
      setError("Please install MetaMask to interact with this dApp.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const p = new BrowserProvider(eth);
      const s = await p.getSigner();
      setProvider(p);
      setAccount(accounts[0]);
      setSigner(s);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to connect wallet";
      if (message.includes("rejected") || message.includes("denied")) {
        setError("Wallet connection rejected.");
      } else {
        setError(message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    resetState();
  }, [resetState]);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    // Check if already connected
    eth.request({ method: "eth_accounts" }).then((accounts) => {
      const accs = accounts as string[];
      if (accs.length > 0) {
        const p = new BrowserProvider(eth);
        setProvider(p);
        setAccount(accs[0]);
        p.getSigner().then(setSigner).catch(console.error);
      }
    });

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    eth.on("disconnect", resetState);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
      eth.removeListener("disconnect", resetState);
    };
  }, [handleAccountsChanged, handleChainChanged, resetState]);

  return { account, provider, signer, isConnecting, error, connect, disconnect };
}
