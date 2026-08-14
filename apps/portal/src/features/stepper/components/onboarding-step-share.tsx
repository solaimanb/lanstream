"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Server, Share2, Copy } from "lucide-react";

interface GeneratedLink {
  token: string;
  guestUrl: string;
}

interface OnboardingStepShareProps {
  createdServerName: string | null;
  generatedLinks: GeneratedLink[];
  isGenerating: boolean;
  onGenerateLink: () => Promise<void>;
  onCopy: (text: string, label: string) => void;
}

export function OnboardingStepShare({
  createdServerName,
  generatedLinks,
  isGenerating,
  onGenerateLink,
  onCopy,
}: OnboardingStepShareProps) {
  return (
    <div className="py-4">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Share2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Share Access</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Generate guest links to share your media.
        </p>
      </div>

      {createdServerName && (
        <Card className="mb-4">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{createdServerName}</span>
            <StatusBadge status="online" />
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        onClick={onGenerateLink}
        disabled={isGenerating}
        className="w-full justify-start gap-3 py-6"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Share2 className="h-4 w-4 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">Create Guest Link</p>
          <p className="text-xs text-muted-foreground">
            Generate a shareable link for guests
          </p>
        </div>
      </Button>

      {generatedLinks.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-center text-xs text-muted-foreground">
            Copy these now. The token will not be shown again.
          </p>
          {generatedLinks.map((link, i) => (
            <Card key={i} className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-3 py-4">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Guest Access Token
                  </p>
                  <InputGroup>
                    <InputGroupInput
                      readOnly
                      value={link.token}
                      className="font-mono text-xs"
                    />
                    <InputGroupAddon align="inline-end">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              onClick={() => onCopy(link.token, "Token")}
                              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                            />
                          }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Copy token</TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Guest Share Link
                  </p>
                  <InputGroup>
                    <InputGroupInput
                      readOnly
                      value={link.guestUrl}
                      className="font-mono text-xs"
                    />
                    <InputGroupAddon align="inline-end">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              onClick={() => onCopy(link.guestUrl, "Link")}
                              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                            />
                          }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Copy link</TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
