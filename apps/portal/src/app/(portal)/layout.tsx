import { getServerSession } from "@/server/auth/session";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center p-2 lg:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
