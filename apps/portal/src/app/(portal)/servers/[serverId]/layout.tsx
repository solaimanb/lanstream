import { getServerSession } from "@/server/auth/session";
import { ensureServerOwnership } from "@/server/security/ownership";
import { notFound, redirect } from "next/navigation";
import { ServerTabs } from "./_components/server-tabs";

export default async function ServerLayout({
  children,
  params,
}: LayoutProps<"/servers/[serverId]">) {
  const { serverId } = await params;
  const session = await getServerSession();
  if (!session?.user) redirect("/sign-in");
  const ownership = await ensureServerOwnership(serverId, session.user.id);
  if (!ownership.ok) notFound();

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <ServerTabs serverId={serverId} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
