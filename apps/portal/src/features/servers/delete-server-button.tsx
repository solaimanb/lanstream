/**
 * Delete server button — client component with confirmation.
 */
"use client";

import { Button } from "@/components/ui/button";
import { deleteServerAction } from "@/server/actions/servers";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteServerButton({ serverId }: { serverId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            "Are you sure you want to delete this server? This cannot be undone.",
          )
        )
          return;
        startTransition(async () => {
          const result = await deleteServerAction(serverId);
          if (result.ok) {
            router.push("/dashboard");
          }
        });
      }}
    >
      {isPending ? "Deleting…" : "Delete Server"}
    </Button>
  );
}
