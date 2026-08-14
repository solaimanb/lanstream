"use client";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { FolderOpen } from "lucide-react";

interface OnboardingStepCreateServerProps {
  serverName: string;
  setServerName: (name: string) => void;
  mediaPath: string;
  setMediaPath: (path: string) => void;
  createError: string | null;
}

export function OnboardingStepCreateServer({
  serverName,
  setServerName,
  mediaPath,
  setMediaPath,
  createError,
}: OnboardingStepCreateServerProps) {
  return (
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
  );
}
