import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Server Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure {server.name}.
        </p>
      </div>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-destructive">
            Deleting this server will permanently remove all data including
            access links and host device records.
          </p>
          <div className="mt-3">
            <DeleteServerButton serverId={serverId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
