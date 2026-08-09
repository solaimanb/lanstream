/**
 * Server list empty state.
 */
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { CreateServerButton } from "./create-server-button";

export function ServerListEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No servers yet</EmptyTitle>
        <EmptyDescription>
          Create your first server to start streaming content across your LAN.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateServerButton />
      </EmptyContent>
    </Empty>
  );
}
