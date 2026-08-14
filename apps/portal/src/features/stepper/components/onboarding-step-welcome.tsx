"use client";

import { Server } from "lucide-react";

export function OnboardingStepWelcome() {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Server className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Welcome to LANStream</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Stream media across your local network.
        <br />
        Set up your first server in 3 simple steps.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        {["Connect", "Create", "Share"].map((label, i) => (
          <div key={label} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {i + 1}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            {i < 2 && <div className="mb-6 h-px w-10 bg-border" />}
          </div>
        ))}
      </div>
    </div>
  );
}
