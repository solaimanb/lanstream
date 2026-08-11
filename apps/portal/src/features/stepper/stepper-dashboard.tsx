"use client";

/**
 * StepperDashboard — the single-page onboarding flow.
 *
 * New users see a 4-step guided flow:
 *   1. Welcome    — intro + what LANStream does
 *   2. Create     — name your server + media path
 *   3. Connect    — pair your host device
 *   4. Share      — generate guest access links
 *
 * Returning users see their servers with management options.
 */
import { useState, useEffect, useCallback } from "react";
import Stepper, { Step } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/feedback/status-badge";
import { createServerAction } from "@/server/actions/servers";
import { createAccessLinkAction } from "@/server/actions/access-links";
import { listMyServers } from "@/server/actions/servers";
import { listMyHostAgents } from "@/server/actions/host-agents";
import { Card } from "@/components/ui/card";
import {
  Server,
  FolderOpen,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Monitor,
  Wifi,
  WifiOff,
  Share2,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@/components/shell/sign-out-button";
import type { ServerDTO } from "@/types";
import type { HostAgentDTO } from "@/server/dal/host-agents";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StepperDashboardProps {
  user: { name?: string | null; email?: string | null } | null;
  initialServers: ServerDTO[];
  initialAgents: HostAgentDTO[];
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function StepperDashboard({
  user,
  initialServers,
  initialAgents,
}: StepperDashboardProps) {
  const [view, setView] = useState<"stepper" | "servers">(
    initialServers.length > 0 ? "servers" : "stepper",
  );

  // ── Stepper state ──
  const [serverName, setServerName] = useState("");
  const [mediaPath, setMediaPath] = useState("/media");
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);
  const [createdServerName, setCreatedServerName] = useState<string | null>(null);
  const [agents, setAgents] = useState<HostAgentDTO[]>(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Access link state ──
  const [generatedLinks, setGeneratedLinks] = useState<
    { token: string; guestUrl: string }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const router = useRouter();

  /* ── Poll for host agents while on the Connect step ── */
  const pollAgents = useCallback(async () => {
    try {
      const result = await listMyHostAgents();
      if (result.ok) {
        setAgents(result.data);
        // Auto-select the first online agent
        const online = result.data.find((a) => a.online);
        if (online && !selectedAgentId) {
          setSelectedAgentId(online.id);
        }
      }
    } catch {
      // silent
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (view !== "stepper") return;
    const interval = setInterval(pollAgents, 3000);
    return () => clearInterval(interval);
  }, [view, pollAgents]);

  /* ── Create server (called from onBeforeStepChange step 3→4) ── */
  const handleCreateServer = async (): Promise<boolean> => {
    if (!serverName.trim() || !mediaPath.trim()) return false;
    setIsCreating(true);
    setCreateError(null);
    try {
      const result = await createServerAction({
        name: serverName.trim(),
        mediaPath: mediaPath.trim(),
        hostAgentId: selectedAgentId || agents[0]?.id || "",
      });
      if (result.ok) {
        setCreatedServerId(result.data.id);
        setCreatedServerName(result.data.name);
        return true;
      } else {
        setCreateError(
          result.error === "host_not_found"
            ? "Please connect a host first."
            : "Could not create server. Try again.",
        );
        return false;
      }
    } catch {
      setCreateError("Something went wrong. Try again.");
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  /* ── Generate access link (Step 4) ── */
  const handleGenerateLink = async () => {
    if (!createdServerId) return;
    setIsGenerating(true);
    try {
      const result = await createAccessLinkAction({
        serverId: createdServerId,
        purpose: "guest",
      });
      if (result.ok) {
        setGeneratedLinks((prev) => [
          ...prev,
          { token: result.data.token, guestUrl: result.data.guestUrl ?? "" },
        ]);
      }
    } catch {
      // silent
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Copy to clipboard ── */
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Delete server ── */
  const handleDeleteServer = async (serverId: string) => {
    if (!confirm("Delete this server permanently?")) return;
    try {
      const { deleteServerAction } = await import("@/server/actions/servers");
      const result = await deleteServerAction(serverId);
      if (result.ok) {
        router.refresh();
        setView("stepper");
      }
    } catch {
      // silent
    }
  };

  /* ── Navigate to server detail ── */
  const goToServer = (serverId: string) => {
    router.push(`/servers/${serverId}`);
  };

  /* ── Switch to stepper for new server ── */
  const startNewServer = () => {
    setServerName("");
    setMediaPath("/media");
    setCreatedServerId(null);
    setCreatedServerName(null);
    setGeneratedLinks([]);
    setCopiedId(null);
    setView("stepper");
  };

  /* ══════════════════════════════════════════════════════════════════ */
  /*  SERVER LIST VIEW (returning users)                               */
  /* ══════════════════════════════════════════════════════════════════ */

  if (view === "servers") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">LANStream</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <SignOutButton />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your Servers</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your media servers and share access with guests.
                </p>
              </div>
              <Button onClick={startNewServer} className="gap-2">
                <Plus className="h-4 w-4" />
                New Server
              </Button>
            </div>

            {/* Server cards */}
            <div className="mt-8 space-y-3">
              {initialServers.map((server) => (
                <Card
                  key={server.id}
                  className="group flex items-center justify-between p-4 transition-colors hover:bg-accent/40"
                >
                  <button
                    onClick={() => goToServer(server.id)}
                    className="flex flex-1 items-center gap-4 text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Server className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{server.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                        <FolderOpen className="h-3 w-3" />
                        <span className="truncate">{server.mediaPath}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={server.status} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteServer(server.id);
                    }}
                    className="ml-3 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Delete server"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}

              {initialServers.length === 0 && (
                <div className="rounded-xl border border-dashed p-12 text-center">
                  <Server className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No servers yet. Create your first one to get started.
                  </p>
                  <Button onClick={startNewServer} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Server
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════ */
  /*  STEPPER VIEW (onboarding / new server)                           */
  /* ══════════════════════════════════════════════════════════════════ */

  const onlineAgents = agents.filter((a) => a.online);
  const hasOnlineHost = onlineAgents.length > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Minimal header */}
      <div className="fixed left-0 right-0 top-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">LANStream</span>
        </div>
        {initialServers.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setView("servers")}>
            Back to servers
          </Button>
        )}
      </div>

      <Stepper
        initialStep={1}
        onStepChange={(step) => {
          if (step === 2) pollAgents();
        }}
        onBeforeStepChange={async (current, next) => {
          // Block advancing from step 2 unless a host is online
          if (current === 2 && !hasOnlineHost) return false;
          // Create server when advancing from step 3 → 4
          if (current === 3 && !createdServerId) {
            return await handleCreateServer();
          }
          return true;
        }}
        onFinalStepCompleted={() => setView("servers")}
        backButtonText="Back"
        nextButtonText="Continue"
        completeButtonText="View Servers"
      >
        {/* ── Step 1: Welcome ── */}
        <Step>
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Server className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Welcome to LANStream</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Stream media across your local network.
              <br />
              Set up your first server in 3 simple steps.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  1
                </div>
                <span>Connect</span>
              </div>
              <div className="h-px w-8 bg-border" />
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  2
                </div>
                <span>Create</span>
              </div>
              <div className="h-px w-8 bg-border" />
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  3
                </div>
                <span>Share</span>
              </div>
            </div>
          </div>
        </Step>

        {/* ── Step 2: Connect Host ── */}
        <Step>
          <div className="py-2">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Connect Your Host</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Open LANStream Host on your media computer to pair it.
                The server will be created once a host is online.
              </p>
            </div>

            {/* Launch button */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <a
                href={`lanstream://pair?portal=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Monitor className="h-4 w-4" />
                Launch LANStream Host
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                If not installed yet, install it once on your media computer.
              </p>
            </div>

            {/* Host status */}
            <div className="mt-4 space-y-2">
              {agents.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  <WifiOff className="h-4 w-4" />
                  <span>Waiting for host connection…</span>
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      agent.online
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                    }`}
                  >
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
                  </div>
                ))
              )}
            </div>

            {!hasOnlineHost && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                The host must be online before you can continue.
              </p>
            )}
          </div>
        </Step>

        {/* ── Step 3: Create Server (after host is connected) ── */}
        <Step>
          <div className="py-2">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Name Your Server</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a name and set the media folder path.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Server Name
                </label>
                <Input
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="My Media Server"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Media Path
                </label>
                <Input
                  value={mediaPath}
                  onChange={(e) => setMediaPath(e.target.value)}
                  placeholder="/media"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Absolute path to your media folder on the host machine.
                </p>
              </div>
            </div>

            {createError && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
                {createError}
              </p>
            )}
          </div>
        </Step>

        {/* ── Step 4: Share ── */}
        <Step>
          <div className="py-2">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Share Access</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate guest links to share your media.
              </p>
            </div>

            {/* Server info */}
            {createdServerName && (
              <div className="mb-4 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {createdServerName}
                  </span>
                  <StatusBadge status="online" />
                </div>
              </div>
            )}

            {/* Generate link button */}
            <button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full rounded-lg border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Share2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Create Guest Link</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a shareable link for guests
                  </p>
                </div>
              </div>
            </button>

            {/* Generated links */}
            {generatedLinks.length > 0 && (
              <div className="mt-4 space-y-2">
                {generatedLinks.map((link, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-primary/20 bg-primary/5 p-3"
                  >
                    <p className="mb-2 text-xs font-medium text-primary">
                      Guest Share Link
                    </p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={link.guestUrl}
                        className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1.5 font-mono text-xs"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(link.guestUrl, `url-${i}`)
                        }
                        className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        {copiedId === `url-${i}` ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Step>
      </Stepper>
    </div>
  );
}
