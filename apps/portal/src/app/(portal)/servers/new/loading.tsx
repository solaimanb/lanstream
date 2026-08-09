export default function NewServerLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-36 animate-pulse rounded bg-muted" />
      <div className="mt-6 max-w-md space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
