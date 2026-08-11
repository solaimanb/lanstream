/**
 * Mobile header — visible only on small screens (lg:hidden).
 *
 * Server Component — lightweight, no client interactivity needed.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function MobileHeader() {
  return (
    <header
      className="flex h-14 items-center border-b border-border bg-background px-4 lg:hidden"
      role="banner"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        aria-label="LANStream — Go to dashboard"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        LANStream
      </Link>
    </header>
  );
}
