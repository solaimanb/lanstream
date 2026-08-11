import { PairHostAgent } from "@/features/host-agents/pair-host-agent";
import { RevokeHostAgentButton } from "@/features/host-agents/revoke-host-agent-button";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Server } from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { listHostAgentsByOwner } from "@/server/dal/host-agents";
import { PORTAL_URL } from "@/lib/env";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export default async function HostsPage() {
  const session = await getServerSession();
  const agents = session?.user
    ? await listHostAgentsByOwner(session.user.id)
    : [];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Host Machines" }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Host Machines</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paired agents start and manage media servers on their local machine.
        </p>
      </div>

      {agents.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No host machines</EmptyTitle>
            <EmptyDescription>
              Pair a host machine to start streaming media across your local network.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <PairHostAgent portalUrl={PORTAL_URL} />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.hostname ?? "Waiting for first connection"}
                      {agent.localIp ? ` · ${agent.localIp}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={agent.online ? "online" : "offline"} />
                  <RevokeHostAgentButton hostAgentId={agent.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PairHostAgent portalUrl={PORTAL_URL} />
    </div>
  );
}
