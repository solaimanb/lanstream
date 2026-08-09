/**
 * Revoke access link button — with confirmation.
 */
"use client";

import { Button } from "@/components/ui/button";
import { revokeAccessLinkAction } from "@/server/actions/access-links";
import { useTransition } from "react";

export function RevokeAccessLinkButton({
  linkId,
  serverId,
}: {
  linkId: string;
  serverId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Revoke this access link?")) return;
        startTransition(async () => {
          await revokeAccessLinkAction({ linkId, serverId });
        });
      }}
    >
      Revoke
    </Button>
  );
}
