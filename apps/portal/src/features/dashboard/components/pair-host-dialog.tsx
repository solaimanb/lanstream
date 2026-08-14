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
import { approveHostAgentAction } from "@/server/actions/host-agents";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Monitor, ExternalLink, KeyRound } from "lucide-react";

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

  const handleLaunchProtocol = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.location.href = lanstreamUrl;
    }
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
          title: "Host Paired",
          description: `"${result.data.requestedName}" is now connected.`,
          type: "success",
        });
        setPairingCode("");
        onOpenChange(false);
        router.refresh();
      } else {
        setError(
          result.error === "expired"
            ? "Pairing code has expired. Open Host app to get a new code."
            : "Invalid pairing code. Please try again.",
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
            Connect a media computer running LANStream Host to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick launch button / link */}
          <a
            href={lanstreamUrl}
            onClick={handleLaunchProtocol}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-center gap-2 py-5 font-medium cursor-pointer"
            )}
          >
            <Monitor className="h-4 w-4 text-primary" />
            Launch Host App Protocol
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-background px-2 text-xs text-muted-foreground">
              or enter pairing code
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
                8-digit Pairing Code
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
                {isPending ? "Pairing…" : "Approve & Pair"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
