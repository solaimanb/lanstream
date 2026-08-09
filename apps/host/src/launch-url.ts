export function portalUrlFromLaunchArguments(
  arguments_: readonly string[],
): string | undefined {
  const raw = arguments_.find((argument) => argument.startsWith("lanstream:"));
  if (!raw) return undefined;

  try {
    const launchUrl = new URL(raw);
    if (launchUrl.protocol !== "lanstream:" || launchUrl.hostname !== "pair") {
      return undefined;
    }
    const portal = new URL(launchUrl.searchParams.get("portal") ?? "");
    if (portal.protocol !== "http:" && portal.protocol !== "https:") {
      return undefined;
    }
    return portal.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}
