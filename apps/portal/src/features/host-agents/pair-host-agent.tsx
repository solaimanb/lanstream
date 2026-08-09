import { buttonVariants } from "@/components/ui/button";

export function PairHostAgent({ portalUrl }: { portalUrl: string }) {
  const launchUrl = `lanstream://pair?portal=${encodeURIComponent(portalUrl)}`;
  return (
    <div className="rounded-xl border p-4">
      <h2 className="font-semibold">Connect another host</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Open LANStream Host on the computer containing your media. It opens a
        secure approval page and connects automatically—no tokens or terminal
        commands.
      </p>
      <a className={buttonVariants({ className: "mt-4" })} href={launchUrl}>
        Launch LANStream Host
      </a>
      <p className="mt-3 text-xs text-muted-foreground">
        If the app is not installed yet, install it once on the media computer.
        It will start automatically with the operating system afterward.
      </p>
    </div>
  );
}
