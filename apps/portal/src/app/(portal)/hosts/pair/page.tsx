import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApproveHostAgent } from "@/features/host-agents/approve-host-agent";

export default async function HostPairingPage({
  searchParams,
}: PageProps<"/hosts/pair">) {
  const { code } = await searchParams;
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connect Host Machine</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm the code shown by LANStream Host. Only approve computers you
          recognize.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pairing Code</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ApproveHostAgent initialCode={typeof code === "string" ? code : ""} />
        </CardContent>
      </Card>
    </div>
  );
}
