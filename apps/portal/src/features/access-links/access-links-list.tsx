/**
 * Access links list — displays and manages access links for a server.
 *
 * Server Component — fetches data via DAL.
 */
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { listAccessLinksByServerId } from "@/server/dal/access-links";
import { AccessLinkItem } from "./access-link-item";
import { CreateAccessLinkButton } from "./create-access-link-button";

export async function AccessLinksList({ serverId }: { serverId: string }) {
  const links = await listAccessLinksByServerId(serverId);

  if (links.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No access links</EmptyTitle>
          <EmptyDescription>
            Create an access link to allow guests to stream files from this server.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateAccessLinkButton serverId={serverId} />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {links.map((link) => (
        <AccessLinkItem
          key={link.id}
          linkId={link.id}
          serverId={serverId}
          tokenPrefix={link.tokenPrefix}
          purpose={link.purpose}
          description={link.description}
          expiresAt={link.expiresAt}
          createdAt={link.createdAt}
        />
      ))}
    </div>
  );
}
