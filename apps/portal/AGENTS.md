<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Portal Framework Rules

1. **Next.js 16.3** — App Router only, no Pages Router.
2. **Proxy convention** — Use `proxy.ts`, NOT `middleware.ts` (deprecated in Next.js 16).
3. **Server Components by default** — Add `"use client"` only to the smallest interactive boundary.
4. **Server Actions** handle portal UI mutations. **Route Handlers** handle HTTP API boundaries.
5. **Never import `src/server`** from a Client Component. Use `import 'server-only'` on sensitive modules.
6. **Server Components read through the DAL** directly — not via fetch.
7. **Do not call the application's own Route Handlers** from Server Components.

## UI Component Rules (shadcn/ui)

1. **Style: base-nova** — Uses `@base-ui/react` primitives, NOT Radix.
2. **Install via CLI**: `pnpm dlx shadcn@latest add <component>` — NEVER hand-roll components.
3. **Use CLI-installed components as-is** — Do NOT add props, variants, or modify the component files.
4. **Button `render` prop** — Use `render={<Link href="..." />}` NOT `asChild` (that's Radix).
5. **No hardcoded colors** — Use shadcn CSS variable tokens: `bg-muted`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`, `bg-destructive/10`, `text-destructive`, `bg-accent`.
6. **Avatar** — Use `<Avatar>` + `<AvatarFallback>` for user initials, NOT hand-rolled `div` circles.
7. **Badge** — Use `<Badge variant="default|secondary|outline">` for status indicators.
8. **Empty state** — Use `<Empty>` + `<EmptyHeader>` + `<EmptyTitle>` + `<EmptyDescription>` + `<EmptyContent>`.
9. **Breadcrumbs** — Use `<Breadcrumb>` + `<BreadcrumbList>` + `<BreadcrumbItem>` + `<BreadcrumbLink>` + `<BreadcrumbPage>` + `<BreadcrumbSeparator>`.

## Form Rules (React Hook Form)

1. **Always use RHF** — `useForm` + `Controller` + Zod schema + `zodResolver`.
2. **Use shadcn Field components** — `<Field>` + `<FieldLabel>` + `<Input>` + `<FieldError>`.
3. **Set `data-invalid={fieldState.invalid}`** on `<Field>` for accessible error styling.
4. **Set `aria-invalid={fieldState.invalid}`** on `<Input>` for accessibility.
5. **Root errors** — Use `form.setError("root", { message: "..." })` for server-side errors.
6. **Auth forms** — Use `form.formState.isSubmitting` for loading state (no `useTransition` needed).
7. **Server action forms** — Use `useTransition` + `isPending` for pending state.
8. **NEVER use manual `useState` for form fields** — Always use RHF.

## Color Token Reference

| Token | Usage |
|---|---|
| `bg-background` | Page/panel background |
| `bg-muted` | Subtle backgrounds, skeleton placeholders |
| `bg-primary text-primary-foreground` | Primary actions, active states |
| `bg-accent text-accent-foreground` | Hover states, secondary highlights |
| `bg-destructive/10 text-destructive` | Error messages, danger zones |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/description text |
| `border-border` | All borders and dividers |
| `divide-border` | List dividers |

## Server & Media Rules

1. **`mediaPath` is portal-owned** — stored in `server` table, validated on create.
2. **Host reads `mediaPath` from portal** during claim — not from env vars.
3. **Guest links are LAN-only** — host enforces RFC 1918 private IP check (10.x, 172.16-31.x, 192.168.x).
4. **Server creation form** requires both `name` and `mediaPath` fields.

## Directory Structure

```
src/
├── app/              # Routing — keep focused on routing only
│   ├── (auth)/       # Auth routes
│   ├── (marketing)/  # Public pages
│   ├── (portal)/     # Authenticated routes
│   └── api/          # Route Handlers
├── components/
│   ├── ui/           # shadcn/ui components (DO NOT modify)
│   ├── shell/        # Layout (sidebar, header, user-menu)
│   ├── navigation/   # Breadcrumbs
│   └── feedback/     # StatusBadge
├── features/         # Domain composition (forms, lists, cards)
├── server/           # Backend (actions, dal, auth, security, validation)
├── lib/              # Utilities
├── hooks/            # Client hooks
└── types/            # Type definitions
```
