"use client";

import { Button } from "@/components/ui/button";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6">
        <h3 className="text-lg font-medium text-destructive">Portal Error</h3>
        <p className="mt-2 text-sm text-destructive">{error.message}</p>
        <Button variant="destructive" size="sm" onClick={() => reset()} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
