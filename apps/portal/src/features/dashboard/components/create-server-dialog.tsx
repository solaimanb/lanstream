"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createServerAction } from "@/server/actions/servers";
import { toast } from "@/components/ui/toast";
import { Plus } from "lucide-react";
import type { HostAgentDTO } from "@/server/dal/host-agents";

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: HostAgentDTO[];
}

export function CreateServerDialog({
  open,
  onOpenChange,
  agents,
}: CreateServerDialogProps) {
  const [name, setName] = useState("");
  const [mediaPath, setMediaPath] = useState("/media");
  const [hostAgentId, setHostAgentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mediaPath.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createServerAction({
        name: name.trim(),
        mediaPath: mediaPath.trim(),
        hostAgentId: hostAgentId || agents[0]?.id || undefined,
      });

      if (result.ok) {
        toast.add({
          title: "Server created",
          description: `"${result.data.name}" has been created.`,
          type: "success",
        });
        setName("");
        setMediaPath("/media");
        setHostAgentId("");
        onOpenChange(false);
        router.refresh();
      } else {
        setError(
          result.error === "host_not_found"
            ? "Selected host agent was not found."
            : "Failed to create server. Check inputs.",
        );
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Media Server
          </DialogTitle>
          <DialogDescription>
            Add a new media server to manage local streaming paths.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Field>
            <FieldLabel htmlFor="new-server-name">Server Name</FieldLabel>
            <Input
              id="new-server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Living Room Server"
              required
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-media-path">Media Path</FieldLabel>
            <Input
              id="new-media-path"
              value={mediaPath}
              onChange={(e) => setMediaPath(e.target.value)}
              placeholder="/media/videos"
              required
            />
            <FieldDescription>
              Path to your media folder on your host machine.
            </FieldDescription>
          </Field>

          {agents.length > 0 && (
            <Field>
              <FieldLabel htmlFor="host-agent-select">Host Machine</FieldLabel>
              <select
                id="host-agent-select"
                value={hostAgentId}
                onChange={(e) => setHostAgentId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Auto-select host</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} {agent.online ? "(Online)" : "(Offline)"}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Creating…" : "Create Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
