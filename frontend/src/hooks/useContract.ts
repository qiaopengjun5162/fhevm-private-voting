"use client";

import { useMemo } from "react";
import { Contract, type JsonRpcSigner } from "ethers";
import { PRIVATE_VOTING_ABI } from "@/lib/abi";

export function useContract(
  contractAddress: string | null,
  signerOrProvider: JsonRpcSigner | import("ethers").BrowserProvider | null
): Contract | null {
  return useMemo(() => {
    if (!contractAddress || !signerOrProvider) return null;
    try {
      return new Contract(contractAddress, PRIVATE_VOTING_ABI, signerOrProvider);
    } catch {
      return null;
    }
  }, [contractAddress, signerOrProvider]);
}
