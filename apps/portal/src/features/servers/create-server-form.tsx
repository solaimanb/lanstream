/**
 * Create server form — RHF + Zod + shadcn Field.
 */
"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createServerAction } from "@/server/actions/servers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Server name is required")
    .max(64, "Server name must be 64 characters or fewer"),
  mediaPath: z
    .string()
    .min(1, "Media path is required")
    .max(512, "Media path must be 512 characters or fewer"),
  hostAgentId: z.uuid("Select a host agent"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateServerForm({
  agents,
}: {
  agents: { id: string; name: string; online: boolean }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mediaPath: "",
      hostAgentId: agents.length === 1 ? agents[0].id : "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        startTransition(async () => {
          const result = await createServerAction(values);
          if (result.ok) {
            router.push(`/servers/${result.data.id}`);
          } else {
            form.setError("root", {
              message:
                result.error === "unauthorized"
                  ? "You must be signed in"
                  : "Invalid server name or media path",
            });
          }
        });
      })}
      className="max-w-md space-y-4"
    >
      {form.formState.errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {form.formState.errors.root.message}
        </div>
      )}

      {agents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm">
          <p className="font-medium">Pair a host before creating a server.</p>
          <p className="mt-1 text-muted-foreground">
            The host agent is what starts streaming on the media machine.
          </p>
          <Link className="mt-3 inline-block underline" href="/hosts">
            Pair a host agent
          </Link>
        </div>
      ) : (
        <Controller
          name="hostAgentId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Host Machine</FieldLabel>
              <select
                {...field}
                id={field.name}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                aria-invalid={fieldState.invalid}
              >
                <option value="">Select a paired host</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.online ? "online" : "offline"})
                  </option>
                ))}
              </select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}

      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Server Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              maxLength={64}
              placeholder="My Media Server"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="mediaPath"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Media Directory Path</FieldLabel>
            <Input
              {...field}
              id={field.name}
              maxLength={512}
              placeholder="/home/user/Movies"
              aria-invalid={fieldState.invalid}
            />
            <p className="text-xs text-muted-foreground">
              Absolute path to the directory containing media files on the host
              machine
            </p>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" disabled={isPending || agents.length === 0}>
        {isPending ? "Creating and starting…" : "Create and Start Server"}
      </Button>
    </form>
  );
}
