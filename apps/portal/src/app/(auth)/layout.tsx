export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <main id="main-content" role="main" className="w-full max-w-sm">
        {children}
      </main>
    </div>
  )
}
