/**
 * Create access link button — triggers server action.
 */
"use client";

import { Button } from "@/components/ui/button";
import { createAccessLinkAction } from "@/server/actions/access-links";
import { useState, useTransition } from "react";

export function CreateAccessLinkButton({
  serverId,
  purpose = "guest",
}: {
  serverId: string;
  purpose?: "host" | "guest";
}) {
  const [isPending, startTransition] = useTransition();
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="default"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await createAccessLinkAction({ serverId, purpose });
            if (result.ok) {
              setCreatedToken(result.data.token);
              setCreatedShareUrl(result.data.guestUrl);
            } else setError("Could not create access link.");
          });
        }}
      >
        {purpose === "host" ? "Create Host Token" : "Create Guest Link"}
      </Button>
      {createdToken && (
        <div className="max-w-md rounded-md border border-accent bg-accent p-3 text-sm text-accent-foreground">
          <p className="font-medium">Copy these now. The token will not be shown again.</p>
          <p className="mt-2 text-xs font-medium">
            {purpose === "host" ? "Host claim token" : "Guest access token"}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              aria-label="New access token"
              className="min-w-0 flex-1 rounded border border-accent bg-card px-2 py-1 font-mono"
              readOnly
              value={createdToken}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copy(createdToken)}
            >
              Copy
            </Button>
          </div>
          {createdShareUrl && (
            <>
              <p className="mt-2 text-xs font-medium">Guest share link</p>
              <div className="mt-1 flex gap-2">
                <input
                  aria-label="New guest share link"
                  className="min-w-0 flex-1 rounded border border-accent bg-card px-2 py-1 font-mono"
                  readOnly
                  value={createdShareUrl}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copy(createdShareUrl)}
                >
                  Copy
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
