import { getServerSession } from "@/server/auth/session";
import { PortalHeader } from "@/components/shell";
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
    <div className="flex h-screen flex-col bg-background">
      <PortalHeader />
      <main id="main-content" className="flex-1 overflow-y-auto" role="main">
        <div className="mx-auto max-w-4xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
