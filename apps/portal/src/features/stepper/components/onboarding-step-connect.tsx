"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Monitor, ExternalLink, Wifi, WifiOff } from "lucide-react";
import type { HostAgentDTO } from "@/server/dal/host-agents";

interface OnboardingStepConnectProps {
  agents: HostAgentDTO[];
  hasOnlineHost: boolean;
}

export function OnboardingStepConnect({
  agents,
  hasOnlineHost,
}: OnboardingStepConnectProps) {
  const portalOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="py-2">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Monitor className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Connect Your Host</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open LANStream Host on your media computer to pair it.
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full justify-center gap-2.5 py-6"
        render={
          <a
            href={`lanstream://pair?portal=${encodeURIComponent(portalOrigin)}`}
          />
        }
      >
        <Monitor className="h-4 w-4" />
        Launch LANStream Host
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Install it once on your media computer if you have not yet.
      </p>

      <div className="mt-4 space-y-2">
        {agents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 py-4 text-center">
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Waiting for host connection…
              </p>
            </CardContent>
          </Card>
        ) : (
          agents.map((agent) => (
            <Card
              key={agent.id}
              className={agent.online ? "border-primary/30 bg-primary/5" : ""}
            >
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  {agent.online ? (
                    <Wifi className="h-4 w-4 text-primary" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.hostname ?? "Connecting…"}
                      {agent.localIp ? ` · ${agent.localIp}` : ""}
                    </p>
                  </div>
                </div>
                <StatusBadge status={agent.online ? "online" : "offline"} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!hasOnlineHost && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          The host must be online before you can continue.
        </p>
      )}
    </div>
  );
}
