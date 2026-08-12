/**
 * Portal header — displays brand name and back navigation.
 *
 * Server Component — lightweight, no client interactivity needed.
 */
import Link from "next/link";

export function PortalHeader() {
  return (
    <header
      className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4"
      role="banner"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        aria-label="LANStream — Go to dashboard"
      >
        LANStream
      </Link>
    </header>
  );
}
