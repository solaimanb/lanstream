/**
 * Create access link form — client component.
 *
 * Uses a server action to create access links.
 */
"use client";

import { Button } from "@/components/ui/button";
import { createAccessLinkAction } from "@/server/actions/access-links";
import { useTransition } from "react";

export function CreateAccessLinkForm({ serverId }: { serverId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await createAccessLinkAction({ serverId });
        });
      }}
    >
      {isPending ? "Creating…" : "Create Link"}
    </Button>
  );
}
