"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAddress, type BrowserProvider, type JsonRpcSigner } from "ethers";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import { DECRYPT_AUTH_DURATION_DAYS } from "@/lib/config";
import type { NetworkInfo, EncryptResult } from "@/types";

type UserDecryptClear = bigint | boolean | number;

function coalesceDecryptValue(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return 0;
}

// Narrow surface used from the lazy-loaded relayer SDK
interface FhevmInstance {
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string,
  ) => {
    add8: (value: number) => {
      encrypt: () => Promise<{
        handles: Uint8Array[];
        inputProof: Uint8Array;
      }>;
    };
  };
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number,
  ) => {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    message: Record<string, unknown>;
  };
  userDecrypt: (
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    account: string,
    startTimestamp: number,
    durationDays: number,
  ) => Promise<Record<string, UserDecryptClear>>;
}

export interface UseFHEReturn {
  /** Sepolia + wallet write path (FHE is supported in principle). */
  canUseFhe: boolean;
  /** Relayer SDK finished `createInstance` successfully. */
  isSdkReady: boolean;
  /** Same as `canUseFhe && isSdkReady` — use for UI that requires a warm SDK. */
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  encryptVote: (optionIndex: number) => Promise<EncryptResult>;
  decryptTally: (encryptedHandle: string) => Promise<number>;
}

export function useFHE(
  provider: BrowserProvider | null,
  signer: JsonRpcSigner | null,
  contractAddress: string | null,
  network: NetworkInfo,
  account: string | null,
): UseFHEReturn {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const instanceRef = useRef<FhevmInstance | null>(null);

  const canUseFhe = !network.isReadOnly && network.isSepolia;
  const isReady = canUseFhe && isSdkReady;

  useEffect(() => {
    instanceRef.current = null;
    setIsSdkReady(false);
    setError(null);
  }, [provider, network.isSepolia, network.isReadOnly]);

  const getInstance = useCallback(async () => {
    if (instanceRef.current) return instanceRef.current;
    if (!provider || !network.isSepolia || network.isReadOnly) {
      throw new Error("FHE operations are only available on Sepolia network.");
    }

    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!ethereum) {
      throw new Error("No EIP-1193 wallet (e.g. MetaMask) found.");
    }

    setIsInitializing(true);
    setError(null);

    try {
      const { initSDK, createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/web");
      await initSDK();
      const instance = (await createInstance({
        ...SepoliaConfig,
        network: ethereum,
      })) as FhevmInstance;
      instanceRef.current = instance;
      setIsSdkReady(true);
      return instance;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to initialize FHE encryption";
      setError(message);
      throw e;
    } finally {
      setIsInitializing(false);
    }
  }, [provider, network.isSepolia, network.isReadOnly]);

  const encryptVote = useCallback(
    async (optionIndex: number): Promise<EncryptResult> => {
      if (!contractAddress || !account) {
        throw new Error("Wallet not connected or contract not loaded.");
      }

      const userAddress = getAddress(account);
      const instance = await getInstance();
      const encrypted = await instance.createEncryptedInput(contractAddress, userAddress).add8(optionIndex).encrypt();
      return {
        handles: encrypted.handles,
        inputProof: encrypted.inputProof,
      };
    },
    [contractAddress, account, getInstance],
  );

  const decryptTally = useCallback(
    async (encryptedHandle: string): Promise<number> => {
      if (!contractAddress || !account || !signer) {
        throw new Error("Wallet not connected or contract not loaded.");
      }

      if (
        !encryptedHandle ||
        encryptedHandle === "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        return 0;
      }

      const userAddress = getAddress(account);
      const instance = await getInstance();
      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        [contractAddress],
        startTimestamp,
        DECRYPT_AUTH_DURATION_DAYS,
      );

      // Use viem for EIP-712 signing — more robust type handling than ethers v6.
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum!),
        account: userAddress as `0x${string}`,
      });

      const signature = await walletClient.signTypedData({
        domain: eip712.domain as Record<string, unknown>,
        types: eip712.types as Record<string, { name: string; type: string }[]>,
        primaryType: "UserDecryptRequestVerification",
        message: eip712.message as Record<string, unknown>,
      });

      const resultMap = await instance.userDecrypt(
        [{ handle: encryptedHandle, contractAddress }],
        keypair.privateKey,
        keypair.publicKey,
        signature,
        [contractAddress],
        userAddress,
        startTimestamp,
        DECRYPT_AUTH_DURATION_DAYS,
      );

      const values = Object.values(resultMap);
      if (values.length === 0) return 0;
      return coalesceDecryptValue(values[0]);
    },
    [contractAddress, account, signer, getInstance],
  );

  return {
    canUseFhe,
    isSdkReady,
    isReady,
    isInitializing,
    error,
    encryptVote,
    decryptTally,
  };
}
