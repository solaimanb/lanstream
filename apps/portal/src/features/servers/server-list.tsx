/**
 * Server list — displays all servers for the current user.
 *
 * Server Component — fetches data via DAL.
 */
import { StatusBadge } from "@/components/feedback/status-badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerSession } from "@/server/auth/session";
import { listServersByOwner } from "@/server/dal/servers";
import { ArrowUpRight, FolderOpen, Server } from "lucide-react";
import Link from "next/link";
import { CreateServerButton } from "./create-server-button";
import { ServerListEmpty } from "./server-list-empty";

export async function ServerList() {
  const session = await getServerSession();

  if (!session?.user) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Please{" "}
          <Link href="/sign-in" className="text-foreground underline">
            sign in
          </Link>{" "}
          to view your servers.
        </p>
      </div>
    );
  }

  const servers = await listServersByOwner(session.user.id);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your local media servers.
          </p>
        </div>
        <CreateServerButton />
      </div>

      <div className="mt-8">
        {servers.length === 0 ? (
          <ServerListEmpty />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {servers.map((server) => (
              <Link
                key={server.id}
                href={`/servers/${server.id}`}
                className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="h-full gap-0 py-0 transition-colors group-hover:bg-accent/40">
                  <CardHeader className="gap-4 px-5 pt-5 pb-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                      <Server className="size-5" aria-hidden="true" />
                    </div>
                    <CardAction>
                      <StatusBadge status={server.status} />
                    </CardAction>
                    <div>
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      <CardDescription className="mt-1 flex min-w-0 items-center gap-1.5">
                        <FolderOpen
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate" title={server.mediaPath}>
                          {server.mediaPath}
                        </span>
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter className="mt-auto justify-between px-5 py-3 text-xs text-muted-foreground">
                    <span>
                      Created{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(server.createdAt)}
                    </span>
                    <ArrowUpRight
                      className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
