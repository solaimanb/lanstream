import {
  AccessLinksList,
  CreateAccessLinkButton,
} from "@/features/access-links";
import { getServerById } from "@/server/dal/servers";
import { notFound } from "next/navigation";

export default async function ServerAccessPage({
  params,
}: PageProps<"/servers/[serverId]/access">) {
  const { serverId } = await params;

  const serverResult = await getServerById(serverId);
  if (!serverResult.ok) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Access Links</h2>
        <CreateAccessLinkButton serverId={serverId} purpose="guest" />
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Manage guest file streaming access for {serverResult.data.name}.
      </p>

      <div className="mt-6">
        <AccessLinksList serverId={serverId} />
      </div>
    </div>
  );
}
