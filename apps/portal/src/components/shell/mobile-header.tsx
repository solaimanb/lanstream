/**
 * Mobile header — visible only on small screens (lg:hidden).
 *
 * Server Component — lightweight, no client interactivity needed.
 */
import Link from "next/link";

export function MobileHeader() {
  return (
    <header className="flex h-14 items-center border-b border-border bg-background px-4 lg:hidden">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        LANStream
      </Link>
    </header>
  );
}
