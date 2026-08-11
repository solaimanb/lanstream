import { getServerSession } from "@/server/auth/session";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileHeader } from "@/components/shell/mobile-header";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "LANStream — Portal",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip to main content — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only z-[9999] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999]"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header — visible only on small screens */}
        <MobileHeader />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
