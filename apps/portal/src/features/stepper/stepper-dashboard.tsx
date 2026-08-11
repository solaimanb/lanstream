"use client";

/**
 * StepperDashboard — the single-page onboarding & management flow.
 *
 * New users see a guided stepper:
 *   1. Welcome — intro
 *   2. Connect — pair host device
 *   3. Create  — name server + media path
 *   4. Share   — generate guest access links
 *
 * Returning users see a server list with management options.
 */
import { useState, useEffect, useCallback } from "react";
import Stepper, { Step } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { StatusBadge } from "@/components/feedback/status-badge";
import { createServerAction } from "@/server/actions/servers";
import { createAccessLinkAction } from "@/server/actions/access-links";
import { listMyHostAgents } from "@/server/actions/host-agents";
import {
  Server,
  FolderOpen,
  Plus,
  Copy,
  Check,
  Monitor,
  Wifi,
  WifiOff,
  Share2,
  ArrowRight,
  Trash2,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { ServerDTO } from "@/types";
import type { HostAgentDTO } from "@/server/dal/host-agents";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface StepperDashboardProps {
  user: { name?: string | null; email?: string | null } | null;
  initialServers: ServerDTO[];
  initialAgents: HostAgentDTO[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StepperDashboard({
  user,
  initialServers,
  initialAgents,
}: StepperDashboardProps) {
  const [view, setView] = useState<"stepper" | "servers">(
    initialServers.length > 0 ? "servers" : "stepper",
  );

  // Stepper form state
  const [serverName, setServerName] = useState("");
  const [mediaPath, setMediaPath] = useState("/media");
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);
  const [createdServerName, setCreatedServerName] = useState<string | null>(
    null,
  );
  const [agents, setAgents] = useState<HostAgentDTO[]>(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [_isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Access link state
  const [generatedLinks, setGeneratedLinks] = useState<
    { token: string; guestUrl: string }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const router = useRouter();

  /* ── Poll for host agents ── */
  const pollAgents = useCallback(async () => {
    try {
      const result = await listMyHostAgents();
      if (result.ok) {
        setAgents(result.data);
        const online = result.data.find((a) => a.online);
        if (online && !selectedAgentId) {
          setSelectedAgentId(online.id);
        }
      }
    } catch {
      /* silent */
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (view !== "stepper") return;
    const interval = setInterval(pollAgents, 3000);
    return () => clearInterval(interval);
  }, [view, pollAgents]);

  /* ── Create server ── */
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
      }
      setCreateError(
        result.error === "host_not_found"
          ? "Please connect a host first."
          : "Could not create server. Try again.",
      );
      return false;
    } catch {
      setCreateError("Something went wrong. Try again.");
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  /* ── Generate access link ── */
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
      /* silent */
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Clipboard ── */
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
      if (result.ok) router.refresh();
    } catch {
      /* silent */
    }
  };

  /* ── Sign out ── */
  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/sign-in"),
      },
    });
  };

  /* ── Navigation ── */
  const goToServer = (id: string) => router.push(`/servers/${id}`);

  const startNewServer = () => {
    setServerName("");
    setMediaPath("/media");
    setCreatedServerId(null);
    setCreatedServerName(null);
    setGeneratedLinks([]);
    setCopiedId(null);
    setView("stepper");
  };

  const onlineAgents = agents.filter((a) => a.online);
  const hasOnlineHost = onlineAgents.length > 0;

  /* ══════════════════════════════════════════════════════════════════ */
  /*  SERVER LIST VIEW                                                 */
  /* ══════════════════════════════════════════════════════════════════ */

  if (view === "servers") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* ── Top bar ── */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">LANStream</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Your Servers</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage media servers and share access with guests.
                </p>
              </div>
              <Button onClick={startNewServer} className="gap-2">
                <Plus className="h-4 w-4" />
                New Server
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {initialServers.map((server) => (
                <Card
                  key={server.id}
                  className="group cursor-pointer transition-colors hover:bg-accent/40"
                >
                  <CardContent className="flex items-center gap-4 py-4">
                    <button
                      onClick={() => goToServer(server.id)}
                      className="flex flex-1 items-center gap-4 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Server className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{server.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <FolderOpen className="h-3 w-3" />
                          <span className="truncate">{server.mediaPath}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={server.status} />
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteServer(server.id);
                      }}
                      className="ml-2 h-8 w-8 shrink-0 p-0 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {initialServers.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Server />
                    </EmptyMedia>
                    <EmptyTitle>No servers yet</EmptyTitle>
                    <EmptyDescription>
                      Create your first server to start streaming media across
                      your local network.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={startNewServer} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Server
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════ */
  /*  STEPPER VIEW                                                     */
  /* ══════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* ── Minimal header ── */}
      <div className="fixed left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">LANStream</span>
        </div>
        {initialServers.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("servers")}
          >
            Back to servers
          </Button>
        )}
      </div>

      <Stepper
        initialStep={1}
        onStepChange={(step) => {
          if (step === 2) pollAgents();
        }}
        onBeforeStepChange={async (current) => {
          if (current === 2 && !hasOnlineHost) return false;
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
              {["Connect", "Create", "Share"].map((label, i) => (
                <div key={label} className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <Badge variant="secondary" className="h-8 w-8 justify-center rounded-full text-[10px] font-bold">
                      {i + 1}
                    </Badge>
                    <span>{label}</span>
                  </div>
                  {i < 2 && <div className="h-px w-8 bg-border" />}
                </div>
              ))}
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
              </p>
            </div>

            {/* Launch button */}
            <Card>
              <CardContent className="py-4 text-center">
                <Button
                  render={
                    <a
                      href={`lanstream://pair?portal=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
                    />
                  }
                  className="gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Launch LANStream Host
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install it once on your media computer if you have not yet.
                </p>
              </CardContent>
            </Card>

            {/* Host status */}
            <div className="mt-4 space-y-2">
              {agents.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  <WifiOff className="h-4 w-4" />
                  <span>Waiting for host connection…</span>
                </div>
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
                      <StatusBadge
                        status={agent.online ? "online" : "offline"}
                      />
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
        </Step>

        {/* ── Step 3: Create Server ── */}
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="My Media Server"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-path">Media Path</Label>
                <Input
                  id="media-path"
                  value={mediaPath}
                  onChange={(e) => setMediaPath(e.target.value)}
                  placeholder="/media"
                />
                <p className="text-xs text-muted-foreground">
                  Absolute path to your media folder on the host machine.
                </p>
              </div>
            </div>

            {createError && (
              <div className="mt-4">
                <Badge variant="destructive" className="w-full justify-center py-1">
                  {createError}
                </Badge>
              </div>
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

            {/* Created server info */}
            {createdServerName && (
              <Card className="mb-4">
                <CardContent className="flex items-center gap-3 py-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {createdServerName}
                  </span>
                  <StatusBadge status="online" />
                </CardContent>
              </Card>
            )}

            {/* Generate button */}
            <Button
              variant="outline"
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full justify-start gap-3 py-6"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Create Guest Link</p>
                <p className="text-xs text-muted-foreground">
                  Generate a shareable link for guests
                </p>
              </div>
            </Button>

            {/* Generated links */}
            {generatedLinks.length > 0 && (
              <div className="mt-4 space-y-2">
                {generatedLinks.map((link, i) => (
                  <Card key={i} className="border-primary/20 bg-primary/5">
                    <CardContent className="py-3">
                      <p className="mb-2 text-xs font-medium text-primary">
                        Guest Share Link
                      </p>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={link.guestUrl}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(link.guestUrl, `url-${i}`)
                          }
                          className="shrink-0"
                        >
                          {copiedId === `url-${i}` ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Step>
      </Stepper>
    </div>
  );
}
