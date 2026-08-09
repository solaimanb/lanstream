export default function SignInLoading() {
  return (
    <div className="w-full max-w-sm">
      <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-6 space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
