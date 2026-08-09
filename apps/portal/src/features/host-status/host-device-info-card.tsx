/**
 * Host device info card — displays host device details.
 *
 * Server Component — pure presentation.
 */
interface HostDevice {
  hostname: string;
  platform: string;
  version: string;
  localIp: string;
  port: number;
  lastSeenAt: Date | null;
}

export function HostDeviceInfoCard({ device }: { device: HostDevice }) {
  return (
    <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Detail label="Hostname" value={device.hostname} />
      <Detail label="Platform" value={device.platform} />
      <Detail label="Version" value={device.version} />
      <Detail label="Local IP" value={device.localIp} />
      <Detail label="Port" value={String(device.port)} />
      <Detail
        label="Last Seen"
        value={device.lastSeenAt ? device.lastSeenAt.toLocaleString() : "Never"}
      />
    </dl>
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
