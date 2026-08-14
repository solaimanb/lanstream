"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { createAccessLinkAction } from "@/server/actions/access-links";
import { toast } from "@/components/ui/toast";
import { Share2, Copy, Plus } from "lucide-react";
import type { ServerDTO } from "@/types";

interface ShareServerDialogProps {
  server: ServerDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareServerDialog({
  server,
  open,
  onOpenChange,
}: ShareServerDialogProps) {
  const [links, setLinks] = useState<
    { token: string; guestUrl: string }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!server) return null;

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const result = await createAccessLinkAction({
        serverId: server.id,
        purpose: "guest",
      });
      if (result.ok) {
        setLinks((prev) => [
          ...prev,
          { token: result.data.token, guestUrl: result.data.guestUrl ?? "" },
        ]);
        toast.add({
          title: "Access link generated",
          description: "Guest share link created successfully.",
          type: "success",
        });
      }
    } catch {
      toast.add({
        title: "Failed to generate link",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        toast.add({ title: `${label} copied to clipboard`, type: "success" });
      });
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.add({ title: `${label} copied to clipboard`, type: "success" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Access — {server.name}
          </DialogTitle>
          <DialogDescription>
            Generate shareable access links for guests on your local network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            {isGenerating ? "Generating…" : "Generate New Guest Link"}
          </Button>

          {links.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Copy these now. The raw token will not be shown again.
              </p>

              {links.map((link, idx) => (
                <div key={idx} className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground">Token</span>
                    <InputGroup className="mt-1">
                      <InputGroupInput readOnly value={link.token} className="font-mono text-xs" />
                      <InputGroupAddon align="inline-end">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => copyToClipboard(link.token, "Token")}
                                className="p-1 hover:text-foreground"
                              />
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>Copy Token</TooltipContent>
                        </Tooltip>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>

                  {link.guestUrl && (
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground">Guest URL</span>
                      <InputGroup className="mt-1">
                        <InputGroupInput readOnly value={link.guestUrl} className="font-mono text-xs" />
                        <InputGroupAddon align="inline-end">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(link.guestUrl, "Guest URL")}
                                  className="p-1 hover:text-foreground"
                                />
                              }
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </TooltipTrigger>
                            <TooltipContent>Copy URL</TooltipContent>
                          </Tooltip>
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
