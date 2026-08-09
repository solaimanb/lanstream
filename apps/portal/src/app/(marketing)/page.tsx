import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50">
      <main className="mx-auto max-w-2xl px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          LANStream
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Stream media across your local network. Connect your devices, share
          files, and enjoy seamless access.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/sign-in" className={buttonVariants({ variant: "default" })}>
            Sign In
          </Link>
          <Link href="/sign-up" className={buttonVariants({ variant: "outline" })}>
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
