"use client";

import { useEffect, useState } from "react";
import { isAddress } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STORAGE_KEYS } from "@/lib/config";
import { truncateAddress } from "@/lib/utils";
import { Check, Copy, Pencil } from "lucide-react";

interface ContractAddressInputProps {
  onAddressChange: (address: string | null) => void;
}

export function ContractAddressInput({ onAddressChange }: ContractAddressInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    if (!loadedAddress) return;
    await navigator.clipboard.writeText(loadedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLoad();
    }
  };

  if (loadedAddress && !isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5 min-w-0">
          <span className="text-xs text-muted-foreground shrink-0">Contract</span>
          <span
            className="font-mono font-bold text-sm text-primary truncate cursor-pointer hover:underline"
            title={loadedAddress}
            onClick={handleCopy}
          >
            {loadedAddress}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-primary/10 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
            )}
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setIsEditing(true); setLoadedAddress(null); onAddressChange(null); }}
          className="shrink-0 gap-1.5 px-4 h-10 font-medium"
        >
          <Pencil className="w-3.5 h-3.5" />
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
        <Button onClick={handleLoad} className="shrink-0 font-semibold">
          Load
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
