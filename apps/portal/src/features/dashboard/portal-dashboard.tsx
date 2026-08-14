"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatsOverview } from "./components/stats-overview";
import { ServerGrid } from "./components/server-grid";
import { HostAgentsCard } from "./components/host-agents-card";
import { CreateServerDialog } from "./components/create-server-dialog";
import { PairHostDialog } from "./components/pair-host-dialog";
import { ShareServerDialog } from "./components/share-server-dialog";
import { Plus, Monitor } from "lucide-react";
import type { ServerDTO } from "@/types";
import type { HostAgentDTO } from "@/server/dal/host-agents";

interface PortalDashboardProps {
  servers: ServerDTO[];
  agents: HostAgentDTO[];
}

export function PortalDashboard({ servers, agents }: PortalDashboardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<ServerDTO | null>(null);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Portal Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your local media servers, host devices, and guest access links.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => setPairOpen(true)}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            Pair Host
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Server
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <StatsOverview servers={servers} agents={agents} />

      {/* Main Grid: Server Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your Servers</h2>
          <span className="text-xs text-muted-foreground">
            {servers.length} configured
          </span>
        </div>
        <ServerGrid
          servers={servers}
          onCreateClick={() => setCreateOpen(true)}
          onShareClick={(srv) => setShareTarget(srv)}
        />
      </div>

      {/* Secondary Section: Host Devices */}
      <div className="space-y-4 pt-4">
        <HostAgentsCard
          agents={agents}
          onPairClick={() => setPairOpen(true)}
        />
      </div>

      {/* Workflows Dialogs */}
      <CreateServerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        agents={agents}
      />

      <PairHostDialog
        open={pairOpen}
        onOpenChange={setPairOpen}
      />

      <ShareServerDialog
        server={shareTarget}
        open={!!shareTarget}
        onOpenChange={(open) => {
          if (!open) setShareTarget(null);
        }}
      />
    </div>
  );
}
