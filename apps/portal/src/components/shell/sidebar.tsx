/**
 * Portal shell — sidebar navigation.
 *
 * Server Component that renders the main navigation structure.
 * Keep this lightweight — no client-side interactivity here.
 */
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/server/auth/session";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export async function Sidebar() {
  const session = await getServerSession();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          LANStream
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/servers/new">New Server</NavLink>
        <NavLink href="/hosts">Host Machines</NavLink>
      </nav>

      {/* User */}
      <div className="border-t border-border p-4">
        {session?.user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>
                  {session.user.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {session.user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        ) : (
          <Button render={<Link href="/sign-in" />} className="w-full">
            Sign In
          </Button>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Internal components                                                */
/* ------------------------------------------------------------------ */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </Link>
  );
}
