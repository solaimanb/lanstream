import { ServerDetail } from "@/features/servers";

export default async function ServerPage({
  params,
}: PageProps<"/servers/[serverId]">) {
  const { serverId } = await params;
  return <ServerDetail serverId={serverId} />;
}
