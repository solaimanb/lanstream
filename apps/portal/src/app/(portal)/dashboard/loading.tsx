export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    </div>
  )
}
