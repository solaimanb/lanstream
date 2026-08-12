import { getServerSession } from "@/server/auth/session";
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

  return <>{children}</>;
}
