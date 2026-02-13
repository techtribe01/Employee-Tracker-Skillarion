"use client"

import { Bell, ChevronRight, Clock, CalendarDays, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const QUICK_STATS = [
  { label: "Hours Today", value: "4h 32m", icon: Clock, color: "bg-primary/10 text-primary" },
  { label: "Tasks Done", value: "3/7", icon: CheckCircle2, color: "bg-success/10 text-success" },
  { label: "Leave Balance", value: "12 days", icon: CalendarDays, color: "bg-info/10 text-info" },
  { label: "Pending", value: "2", icon: AlertCircle, color: "bg-warning/10 text-warning" },
]

const RECENT_TASKS = [
  { title: "Update landing page design", status: "In Progress", priority: "High", color: "bg-warning" },
  { title: "Review API documentation", status: "To Do", priority: "Medium", color: "bg-info" },
  { title: "Fix authentication bug", status: "In Progress", priority: "High", color: "bg-destructive" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good morning</p>
          <h1 className="text-xl font-bold text-foreground">Rahul Kumar</h1>
        </div>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>

      {/* Clock In/Out Card */}
      <div className="rounded-2xl bg-primary p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">Currently clocked in</p>
            <p className="mt-1 text-3xl font-bold text-primary-foreground font-mono">04:32:17</p>
            <p className="mt-1 text-xs text-primary-foreground/60">Started at 9:00 AM</p>
          </div>
          <Button
            size="lg"
            className="h-14 w-14 rounded-2xl bg-primary-foreground text-primary shadow-lg hover:bg-primary-foreground/90"
          >
            <Clock className="h-6 w-6" />
            <span className="sr-only">Clock out</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Recent Tasks</h2>
          <button className="flex items-center gap-1 text-xs font-medium text-primary">
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {RECENT_TASKS.map((task) => (
            <div
              key={task.title}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className={`h-2 w-2 shrink-0 rounded-full ${task.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.status}</p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
