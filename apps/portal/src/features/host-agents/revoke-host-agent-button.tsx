"use client";

import { Button } from "@/components/ui/button";
import { revokeHostAgentAction } from "@/server/actions/host-agents";
import { useTransition } from "react";

export function RevokeHostAgentButton({
  hostAgentId,
}: {
  hostAgentId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm("Revoke this host agent? Assigned servers will stop.")
        ) {
          return;
        }
        startTransition(async () => {
          await revokeHostAgentAction(hostAgentId);
        });
      }}
    >
      {pending ? "Revoking…" : "Revoke"}
    </Button>
  );
}
