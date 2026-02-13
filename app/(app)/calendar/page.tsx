"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const EVENTS = [
  { title: "Team Standup", time: "10:00 AM", type: "meeting" as const },
  { title: "Code Review", time: "2:00 PM", type: "task" as const },
  { title: "Sprint Planning", time: "4:00 PM", type: "meeting" as const },
]

const TYPE_COLORS: Record<string, string> = {
  meeting: "bg-success/10 text-success border-success/20",
  task: "bg-info/10 text-info border-info/20",
  deadline: "bg-destructive/10 text-destructive border-destructive/20",
  leave: "bg-warning/10 text-warning border-warning/20",
}

const TYPE_DOTS: Record<string, string> = {
  meeting: "bg-success",
  task: "bg-info",
  deadline: "bg-destructive",
  leave: "bg-warning",
}

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(13)
  const today = 13

  // Simple Feb 2026 calendar data
  const daysInMonth = 28
  const firstDayOffset = 0 // Feb 1, 2026 is Sunday

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDayOffset; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[120px] text-center">
            February 2026
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border bg-card p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex items-center justify-center py-1 text-[10px] font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        {/* Day numbers */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => (
            <button
              key={i}
              disabled={!day}
              onClick={() => day && setSelectedDay(day)}
              className={`flex h-10 w-full items-center justify-center rounded-xl text-sm transition-colors ${
                !day
                  ? ""
                  : day === selectedDay
                    ? "bg-primary font-bold text-primary-foreground"
                    : day === today
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-muted"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Events for selected day */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Events for Feb {selectedDay}
        </h2>
        <div className="flex flex-col gap-2.5">
          {EVENTS.map((event) => (
            <div
              key={event.title}
              className={`flex items-center gap-3 rounded-xl border p-4 ${TYPE_COLORS[event.type]}`}
            >
              <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${TYPE_DOTS[event.type]}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{event.title}</p>
              </div>
              <div className="flex items-center gap-1 text-xs opacity-80">
                <Clock className="h-3 w-3" />
                {event.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
