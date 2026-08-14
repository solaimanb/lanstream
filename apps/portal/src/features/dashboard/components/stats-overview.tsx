"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Server, Monitor, Wifi } from "lucide-react";
import type { ServerDTO } from "@/types";
import type { HostAgentDTO } from "@/server/dal/host-agents";

interface StatsOverviewProps {
  servers: ServerDTO[];
  agents: HostAgentDTO[];
}

export function StatsOverview({ servers, agents }: StatsOverviewProps) {
  const onlineServers = servers.filter((s) => s.status === "online").length;
  const onlineAgents = agents.filter((a) => a.online).length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="bg-card/50 backdrop-blur-xs">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Servers</p>
            <p className="text-xl font-bold tracking-tight">
              {servers.length}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({onlineServers} online)
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-xs">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Host Devices</p>
            <p className="text-xl font-bold tracking-tight">
              {agents.length}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({onlineAgents} online)
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-xs">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">System Status</p>
            <p className="text-xl font-bold tracking-tight text-emerald-500">
              Operational
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
