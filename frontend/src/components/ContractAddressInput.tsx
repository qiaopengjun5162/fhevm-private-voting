"use client";

import { useEffect, useState } from "react";
import { isAddress } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STORAGE_KEYS } from "@/lib/config";

interface ContractAddressInputProps {
  onAddressChange: (address: string | null) => void;
}

export function ContractAddressInput({ onAddressChange }: ContractAddressInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Restore saved address on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.contractAddress);
    if (saved && isAddress(saved)) {
      setInputValue(saved);
      setLoadedAddress(saved);
      onAddressChange(saved);
    }
  }, [onAddressChange]);

  const handleLoad = () => {
    setError(null);
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError("Please enter a contract address.");
      return;
    }

    if (!isAddress(trimmed)) {
      setError("Invalid Ethereum address.");
      return;
    }

    localStorage.setItem(STORAGE_KEYS.contractAddress, trimmed);
    setLoadedAddress(trimmed);
    setIsEditing(false);
    onAddressChange(trimmed);
  };

  const handleChange = () => {
    setIsEditing(true);
    setLoadedAddress(null);
    onAddressChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLoad();
    }
  };

  if (loadedAddress && !isEditing) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm truncate" title={loadedAddress}>
          Contract: {loadedAddress}
        </span>
        <Button variant="outline" size="sm" onClick={handleChange}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter PrivateVoting contract address (0x...)"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className={error ? "border-red-500" : ""}
        />
        <Button onClick={handleLoad}>Load Contract</Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
