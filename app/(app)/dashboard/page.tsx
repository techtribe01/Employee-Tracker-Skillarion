"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Clock,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Shield,
  Coffee,
  FileText,
  ClipboardList,
  Circle,
  RotateCcw,
  Eye,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getProfile } from "@/lib/auth-actions"
import { getWeeklyStats } from "@/lib/attendance-actions"
import { getMyTasks, getTaskStats, type TaskRow } from "@/lib/task-actions"
import { ClockWidget } from "@/components/clock-widget"
import { NotificationsPanel } from "@/components/notifications-panel"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<{
    first_name: string | null
    last_name: string | null
    role: string
    department: string | null
  } | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<{
    totalHours: number
    totalBreakMinutes: number
    daysWorked: number
    recordCount: number
    dailyBreakdown: Record<string, number>
  } | null>(null)
  const [urgentTasks, setUrgentTasks] = useState<TaskRow[]>([])
  const [taskStats, setTaskStats] = useState<{
    total: number
    not_started: number
    in_progress: number
    under_review: number
    completed: number
    verified: number
    high_priority: number
  } | null>(null)

  useEffect(() => {
    async function load() {
      const [profileResult, statsResult, tasksResult, taskStatsResult] = await Promise.all([
        getProfile(),
        getWeeklyStats(),
        getMyTasks({ status: "in_progress" }),
        getTaskStats(),
      ])
      if (profileResult.profile) setProfile(profileResult.profile)
      if (statsResult.data) setWeeklyStats(statsResult.data)
      if (tasksResult.data) setUrgentTasks(tasksResult.data.slice(0, 3))
      if (taskStatsResult.data) setTaskStats(taskStatsResult.data)
    }
    load()
  }, [])

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      "User"
    : "..."

  const stats = [
    {
      label: "Weekly Hours",
      value: weeklyStats ? `${weeklyStats.totalHours}h` : "--",
      icon: Clock,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Days Worked",
      value: weeklyStats ? `${weeklyStats.daysWorked}` : "--",
      icon: CalendarDays,
      color: "bg-success/10 text-success",
    },
    {
      label: "Break Time",
      value: weeklyStats ? `${weeklyStats.totalBreakMinutes}m` : "--",
      icon: Coffee,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Sessions",
      value: weeklyStats ? `${weeklyStats.recordCount}` : "--",
      icon: CheckCircle2,
      color: "bg-info/10 text-info",
    },
  ]

  // Build weekly chart bars
  const dailyBreakdown = weeklyStats?.dailyBreakdown ?? {}
  const maxHours = Math.max(...Object.values(dailyBreakdown), 1)

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-balance text-foreground">
            {displayName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === "admin" && (
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full"
              >
                <Shield className="h-5 w-5 text-primary" />
                <span className="sr-only">Admin panel</span>
              </Button>
            </Link>
          )}
          <NotificationsPanel />
        </div>
      </div>

      {/* Clock In/Out Widget */}
      <ClockWidget />

      {/* Weekly Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly Hours Chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">This Week</h2>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {weeklyStats?.totalHours ?? 0}h total
          </div>
        </div>
        <div className="flex items-end justify-between gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
            const hours = dailyBreakdown[day] ?? 0
            const heightPercent = maxHours > 0 ? (hours / maxHours) * 100 : 0
            const isToday =
              day ===
              ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                new Date().getDay()
              ]
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-20 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all ${
                      isToday ? "bg-primary" : "bg-primary/30"
                    }`}
                    style={{
                      height: `${Math.max(heightPercent, 4)}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    isToday
                      ? "font-semibold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Tasks */}
      {taskStats && taskStats.total > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">My Tasks</h2>
            </div>
            <Link href="/tasks" className="text-xs text-primary font-medium">
              View all
            </Link>
          </div>

          {/* Mini stat row */}
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {[
              { label: "To Do", value: taskStats.not_started, color: "text-muted-foreground" },
              { label: "Active", value: taskStats.in_progress, color: "text-warning" },
              { label: "Review", value: taskStats.under_review, color: "text-info" },
              { label: "Done", value: taskStats.completed, color: "text-success" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center rounded-lg bg-muted/40 px-1 py-1.5">
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Active task list */}
          {urgentTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {urgentTasks.map((task) => {
                const isUrgent = task.priority === "high" || task.priority === "urgent"
                return (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2 transition-colors active:bg-muted/50">
                      <RotateCcw className="h-3.5 w-3.5 shrink-0 text-warning" />
                      <p className="flex-1 truncate text-xs font-medium text-foreground">{task.title}</p>
                      {isUrgent && <AlertTriangle className="h-3 w-3 shrink-0 text-warning" />}
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-2">No active tasks right now</p>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="flex flex-col gap-2">
        <Link
          href="/attendance"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Attendance History
              </p>
              <p className="text-xs text-muted-foreground">
                View logs & submit manual entries
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          href="/calendar"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <CalendarDays className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Calendar & Schedule
              </p>
              <p className="text-xs text-muted-foreground">
                Events, leaves & deadlines
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          href="/analytics-dashboard"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Analytics Dashboard
              </p>
              <p className="text-xs text-muted-foreground">
                KPIs, charts & metrics
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}
