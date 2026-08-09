"use client";

import { StatusBadge } from "@/components/feedback/status-badge";
import { useServerStatus } from "@/hooks/use-server-status";

export function ServerRuntimeStatus({
  serverId,
  initialStatus,
}: {
  serverId: string;
  initialStatus: string;
}) {
  const { data } = useServerStatus(serverId, { intervalMs: 2_000 });
  const status = data?.server.status ?? initialStatus;
  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} />
      {status === "starting" && (
        <span className="text-xs text-muted-foreground">
          Waiting for the host agent…
        </span>
      )}
    </div>
  );
}
