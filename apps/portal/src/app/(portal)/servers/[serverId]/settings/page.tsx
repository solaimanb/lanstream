import { DeleteServerButton } from "@/features/servers";
import { getServerById } from "@/server/dal/servers";
import { notFound } from "next/navigation";

export default async function ServerSettingsPage({
  params,
}: PageProps<"/servers/[serverId]/settings">) {
  const { serverId } = await params;

  const result = await getServerById(serverId);
  if (!result.ok) notFound();

  const server = result.data;

  return (
    <div>
      <h2 className="text-lg font-semibold">Server Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Configure {server.name}.</p>

      <div className="mt-8 space-y-6">
        <section className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
          <p className="mt-1 text-sm text-destructive">
            Deleting this server will permanently remove all data including
            access links and host device records.
          </p>
          <div className="mt-3">
            <DeleteServerButton serverId={serverId} />
          </div>
        </section>
      </div>
    </div>
  );
}
