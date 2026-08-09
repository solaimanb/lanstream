export default function MarketingLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50">
      <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-6 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-8 flex gap-4">
        <div className="h-12 w-28 animate-pulse rounded bg-muted" />
        <div className="h-12 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
