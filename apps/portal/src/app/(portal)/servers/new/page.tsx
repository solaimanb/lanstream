import { CreateServerForm } from "@/features/servers";
import { getServerSession } from "@/server/auth/session";
import { listHostAgentsByOwner } from "@/server/dal/host-agents";

export default async function NewServerPage() {
  const session = await getServerSession();
  const agents = session?.user
    ? await listHostAgentsByOwner(session.user.id)
    : [];
  return (
    <div>
      <h1 className="text-2xl font-bold">Create Server</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Set up a new media server to stream content across your local network.
      </p>
      <div className="mt-6">
        <CreateServerForm
          agents={agents.map((agent) => ({
            id: agent.id,
            name: agent.name,
            online: agent.online,
          }))}
        />
      </div>
    </div>
  );
}
