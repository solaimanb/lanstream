"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveHostAgentAction } from "@/server/actions/host-agents";
import { useState, useTransition } from "react";

export function ApproveHostAgent({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [message, setMessage] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-6 max-w-md rounded-xl border p-4">
      <label className="text-sm font-medium" htmlFor="pairing-code">
        Pairing code
      </label>
      <Input
        id="pairing-code"
        className="mt-2 font-mono text-lg tracking-widest"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="1234-5678"
        maxLength={9}
        disabled={approved}
      />
      <Button
        className="mt-4 w-full"
        disabled={pending || approved || !/^\d{4}-\d{4}$/.test(code)}
        onClick={() =>
          startTransition(async () => {
            const result = await approveHostAgentAction(code);
            if (result.ok) {
              setApproved(true);
              setMessage(
                `${result.data.requestedName} is connected. You can close this page.`,
              );
            } else {
              setMessage(
                result.error === "expired"
                  ? "This pairing request expired. Reopen the Host app to try again."
                  : "This pairing code is invalid.",
              );
            }
          })
        }
      >
        {pending ? "Connecting…" : approved ? "Connected" : "Approve Host"}
      </Button>
      {message && (
        <p
          className={`mt-3 text-sm ${approved ? "text-foreground" : "text-destructive"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
