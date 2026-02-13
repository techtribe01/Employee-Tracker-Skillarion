import { BottomNav } from "@/components/bottom-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Main content with bottom padding for nav */}
      <main className="flex-1 pb-20">{children}</main>
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
