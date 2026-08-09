import { ApproveHostAgent } from "@/features/host-agents/approve-host-agent";

export default async function HostPairingPage({
  searchParams,
}: PageProps<"/hosts/pair">) {
  const { code } = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-bold">Connect Host Machine</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Confirm the code shown by LANStream Host. Only approve computers you
        recognize.
      </p>
      <ApproveHostAgent initialCode={typeof code === "string" ? code : ""} />
    </div>
  );
}
