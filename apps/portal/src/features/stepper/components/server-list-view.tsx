"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/feedback/status-badge";
import { Server, FolderOpen, Plus, ArrowRight, Trash2 } from "lucide-react";
import type { ServerDTO } from "@/types";

interface ServerListViewProps {
  servers: ServerDTO[];
  onStartNewServer: () => void;
  onGoToServer: (id: string) => void;
  onDeleteServer: (id: string) => Promise<void>;
}

export function ServerListView({
  servers,
  onStartNewServer,
  onGoToServer,
  onDeleteServer,
}: ServerListViewProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Servers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage media servers and share access with guests.
            </p>
          </div>
          <Button onClick={onStartNewServer} className="gap-2">
            <Plus className="h-4 w-4" />
            New Server
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {servers.map((server) => (
            <Card
              key={server.id}
              className="group cursor-pointer transition-colors hover:bg-accent/40"
            >
              <CardContent className="flex items-center gap-4 py-4">
                <button
                  type="button"
                  onClick={() => onGoToServer(server.id)}
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
                <AlertDialog
                  open={deleteTargetId === server.id}
                  onOpenChange={(open) => {
                    if (!open) setDeleteTargetId(null);
                  }}
                >
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
                        This will permanently delete <strong>{server.name}</strong>{" "}
                        and all its access links. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => {
                          onDeleteServer(server.id);
                          setDeleteTargetId(null);
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}

          {servers.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Server />
                </EmptyMedia>
                <EmptyTitle>No servers yet</EmptyTitle>
                <EmptyDescription>
                  Create your first server to start streaming media across your
                  local network.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={onStartNewServer} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Server
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
