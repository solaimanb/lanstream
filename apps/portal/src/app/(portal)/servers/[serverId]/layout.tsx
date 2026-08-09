import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { ensureServerOwnership } from "@/server/security/ownership";
import { notFound, redirect } from "next/navigation";

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
    <div>
      {/* Sub-navigation */}
      <nav className="mb-6 flex gap-4 border-b border-border">
        <Tab href={`/servers/${serverId}`} label="Overview" />
        <Tab href={`/servers/${serverId}/access`} label="Access Links" />
        <Tab href={`/servers/${serverId}/settings`} label="Settings" />
      </nav>

      {children}
    </div>
  );
}

function Tab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-mb-px border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      {label}
    </Link>
  );
}
