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
import { createServerAction, deleteServerAction } from "@/server/actions/servers";
import { createAccessLinkAction } from "@/server/actions/access-links";
import { listMyHostAgents } from "@/server/actions/host-agents";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import type { ServerDTO } from "@/types";
import type { HostAgentDTO } from "@/server/dal/host-agents";

import { ServerListView } from "./components/server-list-view";
import { OnboardingStepWelcome } from "./components/onboarding-step-welcome";
import { OnboardingStepConnect } from "./components/onboarding-step-connect";
import { OnboardingStepCreateServer } from "./components/onboarding-step-create-server";
import { OnboardingStepShare } from "./components/onboarding-step-share";

interface StepperDashboardProps {
  initialServers: ServerDTO[];
  initialAgents: HostAgentDTO[];
}

export function StepperDashboard({
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
  const [createdServerName, setCreatedServerName] = useState<string | null>(null);
  const [agents, setAgents] = useState<HostAgentDTO[]>(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [, setIsCreating] = useState(false);
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

  /* ── Clipboard helper ── */
  const copyToClipboard = (text: string, label: string) => {
    const fallback = () => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.add({ title: `${label} copied`, type: "success" }))
        .catch(() => {
          const ok = fallback();
          toast.add({
            title: ok ? `${label} copied` : "Copy failed",
            type: ok ? "success" : "error",
          });
        });
    } else {
      const ok = fallback();
      toast.add({
        title: ok ? `${label} copied` : "Copy failed",
        type: ok ? "success" : "error",
      });
    }
  };

  /* ── Delete server ── */
  const handleDeleteServer = async (serverId: string) => {
    try {
      const result = await deleteServerAction(serverId);
      if (result.ok) router.refresh();
    } catch {
      /* silent */
    }
  };

  const onlineAgents = agents.filter((a) => a.online);
  const hasOnlineHost = onlineAgents.length > 0;

  /* ── Server List View ── */
  if (view === "servers") {
    return (
      <ServerListView
        servers={initialServers}
        onStartNewServer={() => {
          setServerName("");
          setMediaPath("/media");
          setCreatedServerId(null);
          setCreatedServerName(null);
          setGeneratedLinks([]);
          setView("stepper");
        }}
        onGoToServer={(id) => router.push(`/servers/${id}`)}
        onDeleteServer={handleDeleteServer}
      />
    );
  }

  /* ── Stepper View ── */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {initialServers.length > 0 && (
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("servers")}
          >
            ← Back to servers
          </Button>
        </div>
      )}

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
        <Step>
          <OnboardingStepWelcome />
        </Step>

        <Step>
          <OnboardingStepConnect
            agents={agents}
            hasOnlineHost={hasOnlineHost}
          />
        </Step>

        <Step>
          <OnboardingStepCreateServer
            serverName={serverName}
            setServerName={setServerName}
            mediaPath={mediaPath}
            setMediaPath={setMediaPath}
            createError={createError}
          />
        </Step>

        <Step>
          <OnboardingStepShare
            createdServerName={createdServerName}
            generatedLinks={generatedLinks}
            isGenerating={isGenerating}
            onGenerateLink={handleGenerateLink}
            onCopy={copyToClipboard}
          />
        </Step>
      </Stepper>
    </div>
  );
}
