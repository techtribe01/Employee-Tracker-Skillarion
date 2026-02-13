"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Bell,
  X,
  CheckCheck,
  ClipboardList,
  CheckCircle2,
  XCircle,
  MessageSquare,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/lib/task-actions"

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  task_assigned: { icon: ClipboardList, color: "text-primary bg-primary/10" },
  task_status_change: { icon: CheckCircle2, color: "text-info bg-info/10" },
  task_verified: { icon: CheckCircle2, color: "text-success bg-success/10" },
  task_rejected: { icon: XCircle, color: "text-destructive bg-destructive/10" },
  task_comment: { icon: MessageSquare, color: "text-warning bg-warning/10" },
  user_approved: { icon: UserCheck, color: "text-success bg-success/10" },
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getMyNotifications(30)
    if (result.data) setNotifications(result.data)
    setUnreadCount(result.unreadCount)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Poll every 30 seconds
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  // Reload when sheet opens
  useEffect(() => {
    if (open) load()
  }, [open, load])

  async function handleMarkRead(id: string) {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-[360px] p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.task_assigned
              const Icon = cfg.icon
              const href = n.related_task_id ? `/tasks/${n.related_task_id}` : undefined

              const content = (
                <div
                  className={`flex items-start gap-3 border-b border-border px-5 py-3.5 transition-colors ${
                    n.is_read ? "opacity-60" : "bg-primary/[0.02]"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${n.is_read ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleMarkRead(n.id)
                      }}
                      className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )

              if (href) {
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      if (!n.is_read) handleMarkRead(n.id)
                      setOpen(false)
                    }}
                  >
                    {content}
                  </Link>
                )
              }
              return <div key={n.id}>{content}</div>
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
