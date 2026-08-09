/**
 * Server detail — displays server info and host device details.
 *
 * Server Component — fetches data via DAL.
 */
import { HostDeviceInfoCard } from "@/features/host-status/host-device-info-card";
import { ServerRuntimeStatus } from "@/features/host-status/server-runtime-status";
import { getHostDeviceByServerId } from "@/server/dal/host-devices";
import { getServerById } from "@/server/dal/servers";
import { notFound } from "next/navigation";

export async function ServerDetail({ serverId }: { serverId: string }) {
  const result = await getServerById(serverId);
  if (!result.ok) notFound();

  const server = result.data;
  const hostDevice = await getHostDeviceByServerId(serverId);

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{server.name}</h1>
        <ServerRuntimeStatus
          serverId={server.id}
          initialStatus={server.status}
        />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Detail label="Server ID" value={server.id} />
        <Detail label="Owner" value={server.ownerId} />
        <Detail label="Media Path" value={server.mediaPath} />
        <Detail label="Created" value={server.createdAt.toLocaleDateString()} />
        <Detail label="Updated" value={server.updatedAt.toLocaleDateString()} />
      </dl>

      {hostDevice && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Host Device</h2>
          <HostDeviceInfoCard device={hostDevice} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-sm">{value}</dd>
    </div>
  );
}
