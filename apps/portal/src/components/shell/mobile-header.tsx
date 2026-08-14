/**
 * Portal header — displays brand name, main navigation, and user menu.
 *
 * Server Component — fetches server session for UserMenu.
 */
import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { UserMenu } from "./user-menu";

export async function PortalHeader() {
  const session = await getServerSession();

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-8"
      role="banner"
    >
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label="LANStream — Go to dashboard"
        >
          LANStream
        </Link>
        {session?.user && (
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/hosts"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Hosts
            </Link>
          </nav>
        )}
      </div>
      <UserMenu user={session?.user ?? null} />
    </header>
  );
}
