/**
 * Status badge component — displays server status.
 * Uses shadcn/ui Badge.
 */
import { Badge } from "@/components/ui/badge";
import type { ServerStatus } from "@/types";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  online: "default",
  offline: "secondary",
  starting: "outline",
  stopping: "outline",
};

export function StatusBadge({ status }: { status: ServerStatus | string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
      {status}
    </Badge>
  );
}
