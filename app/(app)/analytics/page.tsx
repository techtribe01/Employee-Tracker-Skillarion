"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CalendarDays,
  Coffee,
  TrendingUp,
  Timer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react"

interface AttendanceRecord {
  id: string
  clock_in: string
  clock_out: string | null
  status: string
  total_hours: number | null
  total_break_minutes: number | null
  is_manual: boolean
  clock_in_lat: number | null
  clock_in_lng: number | null
}

type Period = "week" | "month"

function getWeekRange(offset: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay() + offset * 7)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start, end }
}

function getMonthRange(offset: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  return { start, end }
}

function formatDateRange(start: Date, end: Date, period: Period) {
  if (period === "week") {
    const endAdj = new Date(end)
    endAdj.setDate(endAdj.getDate() - 1)
    return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${endAdj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
  }
  return start.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

export default function AnalyticsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("week")
  const [offset, setOffset] = useState(0)

  const range =
    period === "week" ? getWeekRange(offset) : getMonthRange(offset)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("clock_in", range.start.toISOString())
        .lt("clock_in", range.end.toISOString())
        .order("clock_in", { ascending: true })

      setRecords(data ?? [])
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }, [range.start.toISOString(), range.end.toISOString()])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ========== Computed Stats ==========
  const totalHours = records.reduce((s, r) => s + (r.total_hours ?? 0), 0)
  const totalBreakMinutes = records.reduce(
    (s, r) => s + (r.total_break_minutes ?? 0),
    0
  )
  const completedRecords = records.filter((r) => r.status === "clocked_out")
  const daysWorked = new Set(
    completedRecords.map((r) => new Date(r.clock_in).toDateString())
  ).size
  const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0

  // Daily breakdown for chart
  const dayNames =
    period === "week"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : Array.from(
          {
            length: Math.ceil(
              (range.end.getTime() - range.start.getTime()) / 86400000
            ),
          },
          (_, i) => {
            const d = new Date(range.start)
            d.setDate(d.getDate() + i)
            return d.getDate().toString()
          }
        )

  const dailyHours: Record<string, number> = {}
  if (period === "week") {
    dayNames.forEach((d) => (dailyHours[d] = 0))
    records.forEach((r) => {
      const day =
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          new Date(r.clock_in).getDay()
        ]
      dailyHours[day] = (dailyHours[day] ?? 0) + (r.total_hours ?? 0)
    })
  } else {
    dayNames.forEach((d) => (dailyHours[d] = 0))
    records.forEach((r) => {
      const day = new Date(r.clock_in).getDate().toString()
      dailyHours[day] = (dailyHours[day] ?? 0) + (r.total_hours ?? 0)
    })
  }

  const maxHours = Math.max(...Object.values(dailyHours), 1)

  // Earliest and latest clock-in times
  const clockInTimes = completedRecords.map(
    (r) => new Date(r.clock_in).getHours() + new Date(r.clock_in).getMinutes() / 60
  )
  const avgClockIn =
    clockInTimes.length > 0
      ? clockInTimes.reduce((s, t) => s + t, 0) / clockInTimes.length
      : 0
  const avgClockInStr = clockInTimes.length > 0
    ? `${Math.floor(avgClockIn)}:${Math.round((avgClockIn % 1) * 60)
        .toString()
        .padStart(2, "0")}`
    : "--:--"

  // Overtime count (sessions > 8h)
  const overtimeCount = completedRecords.filter(
    (r) => (r.total_hours ?? 0) > 8
  ).length

  const stats = [
    {
      label: "Total Hours",
      value: `${Math.round(totalHours * 10) / 10}h`,
      icon: Clock,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Days Worked",
      value: daysWorked.toString(),
      icon: CalendarDays,
      color: "bg-success/10 text-success",
    },
    {
      label: "Avg Hours/Day",
      value: `${Math.round(avgHoursPerDay * 10) / 10}h`,
      icon: TrendingUp,
      color: "bg-info/10 text-info",
    },
    {
      label: "Break Time",
      value: `${totalBreakMinutes}m`,
      icon: Coffee,
      color: "bg-warning/10 text-warning",
    },
  ]

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Attendance Reports
        </h1>
        <p className="text-xs text-muted-foreground">
          Track your work patterns over time
        </p>
      </div>

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <Button
            variant={period === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setPeriod("week")
              setOffset(0)
            }}
            className="text-xs"
          >
            Weekly
          </Button>
          <Button
            variant={period === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setPeriod("month")
              setOffset(0)
            }}
            className="text-xs"
          >
            Monthly
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-xs font-medium text-foreground">
            {formatDateRange(range.start, range.end, period)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Hours chart */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {period === "week" ? "Daily Hours" : "Daily Hours (by date)"}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {Math.round(totalHours * 10) / 10}h total
                </span>
              </div>

              {period === "week" ? (
                <div className="flex items-end justify-between gap-1.5">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => {
                      const hours = dailyHours[day] ?? 0
                      const pct =
                        maxHours > 0 ? (hours / maxHours) * 100 : 0
                      const isToday =
                        day ===
                        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                          new Date().getDay()
                        ]
                      return (
                        <div
                          key={day}
                          className="flex flex-1 flex-col items-center gap-1"
                        >
                          {hours > 0 && (
                            <span className="text-[9px] font-medium text-foreground">
                              {Math.round(hours * 10) / 10}
                            </span>
                          )}
                          <div className="relative flex h-20 w-full items-end justify-center">
                            <div
                              className={`w-full max-w-[28px] rounded-t-md transition-all ${
                                isToday && offset === 0
                                  ? "bg-primary"
                                  : "bg-primary/30"
                              }`}
                              style={{
                                height: `${Math.max(pct, hours > 0 ? 8 : 3)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`text-[10px] ${
                              isToday && offset === 0
                                ? "font-semibold text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            {day}
                          </span>
                        </div>
                      )
                    }
                  )}
                </div>
              ) : (
                <div className="flex items-end gap-px overflow-x-auto">
                  {dayNames.map((day) => {
                    const hours = dailyHours[day] ?? 0
                    const pct =
                      maxHours > 0 ? (hours / maxHours) * 100 : 0
                    return (
                      <div
                        key={day}
                        className="flex flex-1 flex-col items-center gap-0.5"
                        style={{ minWidth: 8 }}
                      >
                        <div className="relative flex h-16 w-full items-end justify-center">
                          <div
                            className="w-full max-w-[12px] rounded-t-sm bg-primary/40 transition-all"
                            style={{
                              height: `${Math.max(pct, hours > 0 ? 8 : 2)}%`,
                            }}
                          />
                        </div>
                        {parseInt(day) % 5 === 1 && (
                          <span className="text-[8px] text-muted-foreground">
                            {day}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-border/50">
            <CardContent className="flex flex-col gap-3 p-4">
              <h2 className="text-sm font-semibold text-foreground">
                Insights
              </h2>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Avg. Clock-in Time
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {avgClockInStr}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Overtime Sessions
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {overtimeCount}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Avg. Break/Day
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {daysWorked > 0
                      ? Math.round(totalBreakMinutes / daysWorked)
                      : 0}
                    m
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      GPS-Stamped Sessions
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {records.filter((r) => r.clock_in_lat != null).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Breakdown */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Session Breakdown
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  {
                    label: "Completed",
                    count: completedRecords.length,
                    total: records.length,
                    color: "bg-success",
                  },
                  {
                    label: "Manual",
                    count: records.filter((r) => r.is_manual).length,
                    total: records.length,
                    color: "bg-info",
                  },
                  {
                    label: "Active",
                    count: records.filter(
                      (r) => r.status === "clocked_in"
                    ).length,
                    total: records.length,
                    color: "bg-warning",
                  },
                ].map((item) => {
                  const pct =
                    item.total > 0
                      ? Math.round((item.count / item.total) * 100)
                      : 0
                  return (
                    <div key={item.label} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {item.count}{" "}
                          <span className="text-muted-foreground">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Empty state */}
          {records.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted/50 p-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No data for this period
              </p>
              <p className="text-xs text-muted-foreground">
                Start clocking in to see your attendance analytics
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
