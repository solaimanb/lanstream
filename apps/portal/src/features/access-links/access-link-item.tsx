/**
 * Access link item — single access link row with revoke action.
 */
"use client";

import { RevokeAccessLinkButton } from "./revoke-access-link-button";

interface AccessLinkItemProps {
  linkId: string;
  serverId: string;
  tokenPrefix: string;
  purpose: "host" | "guest";
  description: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export function AccessLinkItem({
  linkId,
  serverId,
  tokenPrefix,
  purpose,
  description,
  expiresAt,
  createdAt,
}: AccessLinkItemProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm">
          {tokenPrefix}…{" "}
          <span className="font-sans text-xs uppercase text-muted-foreground">
            {purpose}
          </span>
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          Created {createdAt.toLocaleDateString()}
          {expiresAt && ` · Expires ${expiresAt.toLocaleDateString()}`}
        </p>
      </div>
      <RevokeAccessLinkButton linkId={linkId} serverId={serverId} />
    </div>
  );
}
