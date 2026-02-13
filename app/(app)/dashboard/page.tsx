"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Bell,
  ChevronRight,
  Clock,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Shield,
  Coffee,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProfile } from "@/lib/auth-actions"
import { getWeeklyStats } from "@/lib/attendance-actions"
import { ClockWidget } from "@/components/clock-widget"

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

  useEffect(() => {
    async function load() {
      const [profileResult, statsResult] = await Promise.all([
        getProfile(),
        getWeeklyStats(),
      ])
      if (profileResult.profile) setProfile(profileResult.profile)
      if (statsResult.data) setWeeklyStats(statsResult.data)
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
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Notifications</span>
          </Button>
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
          href="/analytics"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Attendance Reports
              </p>
              <p className="text-xs text-muted-foreground">
                Weekly & monthly analytics
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}
