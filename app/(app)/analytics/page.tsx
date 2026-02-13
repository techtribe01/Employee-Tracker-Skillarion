"use client"

import { TrendingUp, TrendingDown, Clock, CheckCircle2, Target, CalendarDays } from "lucide-react"

const STATS = [
  {
    label: "Avg. Hours/Day",
    value: "7.5h",
    change: "+0.3h",
    trend: "up" as const,
    icon: Clock,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Tasks Completed",
    value: "23",
    change: "+5",
    trend: "up" as const,
    icon: CheckCircle2,
    color: "bg-success/10 text-success",
  },
  {
    label: "Productivity",
    value: "87%",
    change: "-2%",
    trend: "down" as const,
    icon: Target,
    color: "bg-info/10 text-info",
  },
  {
    label: "Attendance",
    value: "96%",
    change: "+1%",
    trend: "up" as const,
    icon: CalendarDays,
    color: "bg-warning/10 text-warning",
  },
]

const WEEKLY_DATA = [
  { day: "Mon", hours: 8.0 },
  { day: "Tue", hours: 7.5 },
  { day: "Wed", hours: 8.5 },
  { day: "Thu", hours: 7.0 },
  { day: "Fri", hours: 6.5 },
]

const maxHours = Math.max(...WEEKLY_DATA.map((d) => d.hours))

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          This Week
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Weekly hours chart (simple bar chart) */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Weekly Hours</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {WEEKLY_DATA.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-foreground">{d.hours}h</span>
              <div
                className="w-full rounded-t-lg bg-primary/20 relative overflow-hidden"
                style={{ height: `${(d.hours / maxHours) * 100}px` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-primary"
                  style={{ height: `${(d.hours / 8) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task distribution */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Task Distribution</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Completed", value: 65, color: "bg-success" },
            { label: "In Progress", value: 25, color: "bg-warning" },
            { label: "Overdue", value: 10, color: "bg-destructive" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold text-foreground">{item.value}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${item.color} transition-all`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
