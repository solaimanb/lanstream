/**
 * Server status route handler.
 * Returns current host status for a specific server.
 * Must NOT be cached — returns live runtime state.
 */
export const dynamic = "force-dynamic";

import { getHostDeviceByServerId } from "@/server/dal/host-devices";
import { getServerSession } from "@/server/auth/session";
import { ensureServerOwnership } from "@/server/security/ownership";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/servers/[serverId]/status">,
) {
  const { serverId } = await context.params;
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json(
      { data: null, error: { code: "unauthorized", message: "unauthorized" } },
      { status: 401 },
    );
  }

  const serverResult = await ensureServerOwnership(serverId, session.user.id);
  if (!serverResult.ok) {
    return Response.json(
      { data: null, error: { code: "not_found", message: "not_found" } },
      { status: 404 },
    );
  }

  const hostDevice = await getHostDeviceByServerId(serverId);

  return Response.json({
    data: {
      server: serverResult.data,
      hostDevice: hostDevice ?? null,
    },
    error: null,
  });
}
