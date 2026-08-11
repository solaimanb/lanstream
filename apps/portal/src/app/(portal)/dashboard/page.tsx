import { getServerSession } from "@/server/auth/session";
import { listServersByOwner } from "@/server/dal/servers";
import { listHostAgentsByOwner } from "@/server/dal/host-agents";
import { StepperDashboard } from "@/features/stepper";

export default async function DashboardPage() {
  const session = await getServerSession();
  const userId = session?.user?.id;
  const [servers, agents] = userId
    ? await Promise.all([
        listServersByOwner(userId),
        listHostAgentsByOwner(userId),
      ])
    : [[], []];

  return (
    <StepperDashboard
      initialServers={servers}
      initialAgents={agents}
    />
  );
}
