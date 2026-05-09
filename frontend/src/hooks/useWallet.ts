"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  disconnect: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid stale closure issues in event handlers
  const accountRef = useRef<string | null>(null);

  const resetState = useCallback(() => {
    accountRef.current = null;
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
        return;
      }
      const newAccount = accs[0];
      // Only update if account actually changed
      if (newAccount === accountRef.current) return;
      accountRef.current = newAccount;

      const eth = getEthereum();
      if (eth) {
        const p = new BrowserProvider(eth);
        setProvider(p);
        setAccount(newAccount);
        p.getSigner().then(setSigner).catch(console.error);
      }
    },
    [resetState]
  );

  const handleChainChanged = useCallback(() => {
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
      accountRef.current = accounts[0];
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

  const disconnect = useCallback(async () => {
    const eth = getEthereum();
    if (eth) {
      try {
        // Revoke MetaMask permissions so the wallet shows "not connected"
        await eth.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // wallet_revokePermissions is not supported by all wallets
      }
    }
    resetState();
  }, [resetState]);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    // Check if already connected
    eth.request({ method: "eth_accounts" }).then((accounts) => {
      const accs = accounts as string[];
      if (accs.length > 0) {
        accountRef.current = accs[0];
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
