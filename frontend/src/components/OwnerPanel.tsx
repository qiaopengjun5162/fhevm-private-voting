"use client";

import { useState } from "react";
import { Contract, isAddress } from "ethers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { VotingPhase, VotingState } from "@/types";

interface OwnerPanelProps {
  contract: Contract | null;
  state: VotingState | null;
  phase: VotingPhase | null;
  account: string | null;
}

export function OwnerPanel({ contract, state, phase, account }: OwnerPanelProps) {
  const [publishing, setPublishing] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);
  const [pubSuccess, setPubSuccess] = useState(false);

  const [grantAddress, setGrantAddress] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState(false);

  const isOwner =
    account &&
    state &&
    account.toLowerCase() === state.owner.toLowerCase();

  if (!contract || !isOwner) return null;

  const handlePublish = async () => {
    if (!contract) return;
    setPublishing(true);
    setPubError(null);
    setPubSuccess(false);
    try {
      const tx = await contract.publishResults();
      await tx.wait();
      setPubSuccess(true);
    } catch (e) {
      setPubError(e instanceof Error ? e.message : "Failed to publish results.");
    } finally {
      setPublishing(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!contract || !isAddress(grantAddress)) return;
    setGranting(true);
    setGrantError(null);
    setGrantSuccess(false);
    try {
      const tx = await contract.grantResultAccess(grantAddress);
      await tx.wait();
      setGrantSuccess(true);
      setGrantAddress("");
    } catch (e) {
      setGrantError(e instanceof Error ? e.message : "Failed to grant access.");
    } finally {
      setGranting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Publish Results */}
        {phase === "ended" && (
          <div className="space-y-2">
            <CardDescription>
              Voting has ended. Publish the results to allow decryption.
            </CardDescription>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing..." : "Publish Results"}
            </Button>
            {pubError && (
              <Alert variant="destructive">
                <AlertDescription>{pubError}</AlertDescription>
              </Alert>
            )}
            {pubSuccess && (
              <Alert className="border-green-500/30 bg-green-500/10">
                <AlertDescription className="text-green-400">Results published successfully.</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {phase === "results_published" && (
          <>
            <CardDescription>
              Results have been published. Grant access to specific addresses to view decrypted
              tallies.
            </CardDescription>

            {/* Grant Access */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Viewer address (0x...)"
                  value={grantAddress}
                  onChange={(e) => {
                    setGrantAddress(e.target.value);
                    setGrantError(null);
                  }}
                />
                <Button
                  onClick={handleGrantAccess}
                  disabled={granting || !isAddress(grantAddress)}
                >
                  {granting ? "Granting..." : "Grant Access"}
                </Button>
              </div>
              {grantError && (
                <Alert variant="destructive">
                  <AlertDescription>{grantError}</AlertDescription>
                </Alert>
              )}
              {grantSuccess && (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <AlertDescription className="text-green-400">Access granted successfully.</AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {phase === "live" && (
          <CardDescription>
            Owner controls will be available after the voting ends.
          </CardDescription>
        )}

        {phase === "before_start" && (
          <CardDescription>
            Owner controls will be available after the voting starts.
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
