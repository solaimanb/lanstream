"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/feedback/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { revokeHostAgentAction } from "@/server/actions/host-agents";
import { toast } from "@/components/ui/toast";
import { Monitor, Wifi, WifiOff, Plus, Trash2 } from "lucide-react";
import type { HostAgentDTO } from "@/server/dal/host-agents";

interface HostAgentsCardProps {
  agents: HostAgentDTO[];
  onPairClick: () => void;
}

export function HostAgentsCard({ agents, onPairClick }: HostAgentsCardProps) {
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const router = useRouter();

  const handleRevoke = async (id: string) => {
    try {
      const result = await revokeHostAgentAction(id);
      if (result.ok) {
        toast.add({ title: "Host agent revoked", type: "success" });
        router.refresh();
      }
    } catch {
      toast.add({ title: "Failed to revoke host agent", type: "error" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Host Devices</CardTitle>
        </div>
        <Button size="sm" variant="outline" onClick={onPairClick} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Pair Host
        </Button>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-6 text-center">
            <WifiOff className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">No paired hosts</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              Pair your media computer running LANStream Host to enable local media streaming.
            </p>
            <Button size="sm" onClick={onPairClick} className="mt-4 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Pair Host Device
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-center gap-3">
                  {agent.online ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Wifi className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <WifiOff className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.hostname ?? "Unnamed Machine"}
                      {agent.localIp ? ` · ${agent.localIp}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={agent.online ? "online" : "offline"} />
                  <AlertDialog
                    open={revokeTargetId === agent.id}
                    onOpenChange={(open) => {
                      if (!open) setRevokeTargetId(null);
                    }}
                  >
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setRevokeTargetId(agent.id)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        />
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Host?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will unpair <strong>{agent.name}</strong> from your portal account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleRevoke(agent.id)}
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
