"use client";

import { useCallback, useRef, useState } from "react";
import type { BrowserProvider, JsonRpcSigner } from "ethers";
import { SEPOLIA_RELAYER_URL, DECRYPT_AUTH_DURATION_DAYS } from "@/lib/config";
import type { NetworkInfo, EncryptResult } from "@/types";

// Dynamic type for the relayer instance since we lazy-import it
interface FhevmInstance {
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string
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
    durationDays: number
  ) => { domain: Record<string, unknown>; types: Record<string, unknown>; message: Record<string, unknown> };
  userDecrypt: (
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    account: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<bigint[]>;
}

export interface UseFHEReturn {
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
  account: string | null
): UseFHEReturn {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<FhevmInstance | null>(null);

  const isReady = !network.isReadOnly && network.isSepolia;

  const getInstance = useCallback(async () => {
    if (instanceRef.current) return instanceRef.current;
    if (!provider || !network.isSepolia) {
      throw new Error("FHE operations are only available on Sepolia network.");
    }

    setIsInitializing(true);
    setError(null);

    try {
      const { initSDK, createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/web");
      await initSDK();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = (await createInstance({
        ...SepoliaConfig,
        network: (window as any).ethereum,
      })) as any as FhevmInstance;
      instanceRef.current = instance;
      return instance;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to initialize FHE encryption";
      setError(message);
      throw e;
    } finally {
      setIsInitializing(false);
    }
  }, [provider, network.isSepolia]);

  const encryptVote = useCallback(
    async (optionIndex: number): Promise<EncryptResult> => {
      if (!contractAddress || !account) {
        throw new Error("Wallet not connected or contract not loaded.");
      }

      const instance = await getInstance();
      const encrypted = await instance
        .createEncryptedInput(contractAddress, account)
        .add8(optionIndex)
        .encrypt();
      return {
        handles: encrypted.handles,
        inputProof: encrypted.inputProof,
      };
    },
    [contractAddress, account, getInstance]
  );

  const decryptTally = useCallback(
    async (encryptedHandle: string): Promise<number> => {
      if (!contractAddress || !account || !signer) {
        throw new Error("Wallet not connected or contract not loaded.");
      }

      if (!encryptedHandle || encryptedHandle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        return 0;
      }

      const instance = await getInstance();
      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        [contractAddress],
        startTimestamp,
        DECRYPT_AUTH_DURATION_DAYS
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signature = await signer.signTypedData(
        eip712.domain as any,
        eip712.types as any,
        eip712.message as any
      );

      const result = await instance.userDecrypt(
        [{ handle: encryptedHandle, contractAddress }],
        keypair.privateKey,
        keypair.publicKey,
        signature,
        [contractAddress],
        account,
        startTimestamp,
        DECRYPT_AUTH_DURATION_DAYS
      );

      return result[0] ? Number(result[0]) : 0;
    },
    [contractAddress, account, signer, getInstance]
  );

  return { isReady, isInitializing, error, encryptVote, decryptTally };
}
