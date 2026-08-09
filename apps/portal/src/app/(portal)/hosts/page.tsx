import { PairHostAgent } from "@/features/host-agents/pair-host-agent";
import { RevokeHostAgentButton } from "@/features/host-agents/revoke-host-agent-button";
import { StatusBadge } from "@/components/feedback/status-badge";
import { getServerSession } from "@/server/auth/session";
import { listHostAgentsByOwner } from "@/server/dal/host-agents";
import { PORTAL_URL } from "@/lib/env";

export default async function HostsPage() {
  const session = await getServerSession();
  const agents = session?.user
    ? await listHostAgentsByOwner(session.user.id)
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Host Machines</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paired agents start and manage media servers on their local machine.
      </p>
      <div className="mt-6 space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <div>
              <p className="font-medium">{agent.name}</p>
              <p className="text-sm text-muted-foreground">
                {agent.hostname ?? "Waiting for first connection"}
                {agent.localIp ? ` · ${agent.localIp}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.online ? "online" : "offline"} />
              <RevokeHostAgentButton hostAgentId={agent.id} />
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No host machines are paired yet.
          </p>
        )}
      </div>
      <div className="mt-6">
        <PairHostAgent portalUrl={PORTAL_URL} />
      </div>
    </div>
  );
}
