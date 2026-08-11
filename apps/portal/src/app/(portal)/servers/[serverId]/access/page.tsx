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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Access Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage guest file streaming access for {serverResult.data.name}.
          </p>
        </div>
        <CreateAccessLinkButton serverId={serverId} purpose="guest" />
      </div>

      <AccessLinksList serverId={serverId} />
    </div>
  );
}
