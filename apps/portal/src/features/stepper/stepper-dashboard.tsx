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
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { StatusBadge } from "@/components/feedback/status-badge";
import { createServerAction } from "@/server/actions/servers";
import { createAccessLinkAction } from "@/server/actions/access-links";
import { listMyHostAgents } from "@/server/actions/host-agents";
import {
  Server,
  FolderOpen,
  Plus,
  Copy,
  Monitor,
  Wifi,
  WifiOff,
  Share2,
  ArrowRight,
  Trash2,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function userInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
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
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.add({ title: `${label} copied`, type: "success" });
    } catch {
      toast.add({ title: "Failed to copy", type: "error" });
    }
  };

  /* ── Delete server ── */
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDeleteServer = async (serverId: string) => {
    try {
      const { deleteServerAction } = await import("@/server/actions/servers");
      const result = await deleteServerAction(serverId);
      if (result.ok) router.refresh();
    } catch {
      /* silent */
    }
    setDeleteTargetId(null);
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              }
            >
              <Avatar size="sm">
                <AvatarFallback>{userInitials(user?.name, user?.email)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.name ?? user?.email}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuLabel>
                {user?.name ?? user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <AlertDialog open={deleteTargetId === server.id} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetId(server.id);
                            }}
                            className="ml-2 shrink-0 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          />
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete server?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{server.name}</strong> and all its access links. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDeleteServer(server.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
          <div className="py-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Server className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Welcome to LANStream</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Stream media across your local network.
              <br />
              Set up your first server in 3 simple steps.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              {["Connect", "Create", "Share"].map((label, i) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  </div>
                  {i < 2 && <div className="mb-6 h-px w-10 bg-border" />}
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
            <Button
              variant="outline"
              className="w-full justify-center gap-2.5 py-6"
              render={
                <a
                  href={`lanstream://pair?portal=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
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

            {/* Host status */}
            <div className="mt-4 space-y-2">
              {agents.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex items-center gap-3 py-4 text-center">
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Waiting for host connection…</p>
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
          <div className="py-4">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Name Your Server</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Choose a name and set the media folder path.
              </p>
            </div>

            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="server-name">Server Name</FieldLabel>
                <Input
                  id="server-name"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="My Media Server"
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="media-path">Media Path</FieldLabel>
                <Input
                  id="media-path"
                  value={mediaPath}
                  onChange={(e) => setMediaPath(e.target.value)}
                  placeholder="/media"
                />
                <FieldDescription>
                  Absolute path to your media folder on the host machine.
                </FieldDescription>
              </Field>
            </div>

            {createError && (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <p className="text-center text-sm text-destructive">{createError}</p>
              </div>
            )}
          </div>
        </Step>

        {/* ── Step 4: Share ── */}
        <Step>
          <div className="py-4">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Share Access</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Generate guest links to share your media.
              </p>
            </div>

            {/* Created server info */}
            {createdServerName && (
              <Card className="mb-4">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-4 w-4 text-primary" />
                  </div>
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
              <div className="mt-4 space-y-3">
                <p className="text-center text-xs text-muted-foreground">
                  Copy these now. The token will not be shown again.
                </p>
                {generatedLinks.map((link, i) => (
                  <Card key={i} className="border-primary/20 bg-primary/5">
                    <CardContent className="space-y-3 py-4">
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                          Guest Access Token
                        </p>
                        <InputGroup>
                          <InputGroupInput
                            readOnly
                            value={link.token}
                            className="font-mono text-xs"
                          />
                          <InputGroupAddon align="inline-end">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(link.token, "Token")}
                                    className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                                  />
                                }
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </TooltipTrigger>
                              <TooltipContent>Copy token</TooltipContent>
                            </Tooltip>
                          </InputGroupAddon>
                        </InputGroup>
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                          Guest Share Link
                        </p>
                        <InputGroup>
                          <InputGroupInput
                            readOnly
                            value={link.guestUrl}
                            className="font-mono text-xs"
                          />
                          <InputGroupAddon align="inline-end">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(link.guestUrl, "Link")}
                                    className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                                  />
                                }
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </TooltipTrigger>
                              <TooltipContent>Copy link</TooltipContent>
                            </Tooltip>
                          </InputGroupAddon>
                        </InputGroup>
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
