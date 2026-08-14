"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approveHostAgentAction,
  autoPairLatestHostAction,
} from "@/server/actions/host-agents";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Monitor, ExternalLink, KeyRound, Info, Zap } from "lucide-react";

interface PairHostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PairHostDialog({ open, onOpenChange }: PairHostDialogProps) {
  const [pairingCode, setPairingCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const portalOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const lanstreamUrl = `lanstream://pair?portal=${encodeURIComponent(portalOrigin)}`;

  const handleLaunchClick = () => {
    toast.add({
      title: "Opening LANStream Host",
      description: "If the application doesn't open automatically, click 'Auto-Detect Host' or enter its 8-digit code below.",
      type: "info",
    });
  };

  const handleAutoPair = () => {
    setError(null);
    startTransition(async () => {
      const result = await autoPairLatestHostAction();
      if (result.ok) {
        toast.add({
          title: "Host Auto-Paired!",
          description: `Successfully connected "${result.data.requestedName}".`,
          type: "success",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.add({
          title: "No Host Found",
          description: "No pending host pairing requests detected. Make sure LANStream Host is running on your machine.",
          type: "warning",
        });
      }
    });
  };

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{4}$/.test(pairingCode)) {
      setError("Please enter a valid 8-digit code (e.g. 1234-5678)");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await approveHostAgentAction(pairingCode);
      if (result.ok) {
        toast.add({
          title: "Host Device Paired",
          description: `"${result.data.requestedName}" is now paired and connected.`,
          type: "success",
        });
        setPairingCode("");
        onOpenChange(false);
        router.refresh();
      } else {
        setError(
          result.error === "expired"
            ? "Pairing code has expired. Open Host app to generate a fresh code."
            : "Invalid or unknown pairing code. Please double-check and try again.",
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Pair Host Device
          </DialogTitle>
          <DialogDescription>
            Connect a media computer running LANStream Host to your portal account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instructions Box */}
          <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">How to pair a host machine:</p>
              <p className="mt-0.5 text-muted-foreground">
                Run <strong>LANStream Host</strong> on your media PC. Click <strong>Auto-Detect Host</strong> or enter its 8-digit code below.
              </p>
            </div>
          </div>

          {/* 1-Click Auto-Detect Button */}
          <Button
            onClick={handleAutoPair}
            disabled={isPending}
            className="w-full justify-center gap-2 py-5 font-semibold"
          >
            <Zap className="h-4 w-4 fill-primary-foreground" />
            Auto-Detect & Approve Pending Host
          </Button>

          {/* Quick launch link */}
          <a
            href={lanstreamUrl}
            onClick={handleLaunchClick}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-center gap-2 py-5 font-medium cursor-pointer"
            )}
          >
            <Monitor className="h-4 w-4 text-primary" />
            Launch Local Host App Protocol
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-background px-2 text-xs text-muted-foreground font-medium">
              or enter pairing code manually
            </span>
          </div>

          {/* Code form */}
          <form onSubmit={handlePairSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="dashboard-pairing-code"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                8-digit Pairing Code from Host App
              </label>
              <Input
                id="dashboard-pairing-code"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
                placeholder="1234-5678"
                className="font-mono text-base tracking-widest text-center"
                maxLength={9}
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-destructive text-center">
                {error}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !/^\d{4}-\d{4}$/.test(pairingCode)}
              >
                {isPending ? "Pairing…" : "Approve & Pair Host"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
