"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/feedback/status-badge";
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
import { deleteServerAction } from "@/server/actions/servers";
import { toast } from "@/components/ui/toast";
import { Server, FolderOpen, Share2, Plus, ArrowRight, Trash2 } from "lucide-react";
import type { ServerDTO } from "@/types";

interface ServerGridProps {
  servers: ServerDTO[];
  onCreateClick: () => void;
  onShareClick: (server: ServerDTO) => void;
}

export function ServerGrid({
  servers,
  onCreateClick,
  onShareClick,
}: ServerGridProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteServerAction(id);
      if (result.ok) {
        toast.add({
          title: "Server deleted",
          type: "success",
        });
        router.refresh();
      }
    } catch {
      toast.add({
        title: "Failed to delete server",
        type: "error",
      });
    }
  };

  if (servers.length === 0) {
    return (
      <Empty className="border-dashed my-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Server />
          </EmptyMedia>
          <EmptyTitle>No servers configured</EmptyTitle>
          <EmptyDescription>
            Create your first media server to manage local streaming paths.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Server
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {servers.map((server) => (
        <Card
          key={server.id}
          className="group relative flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Server className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={server.status} />
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
                        className="text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
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
                        and its access links.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDelete(server.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-base tracking-tight text-foreground">
                {server.name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{server.mediaPath}</span>
              </div>
            </div>
          </CardContent>

          <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShareClick(server)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Link
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/servers/${server.id}`)}
              className="gap-1 text-xs font-medium text-primary hover:text-primary"
            >
              Manage
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
