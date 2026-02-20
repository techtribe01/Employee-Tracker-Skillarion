"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  X,
  MapPin,
  Calendar as CalendarIcon,
  Globe,
  Briefcase,
  Users,
  Palmtree,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventRow,
  type EventType,
} from "@/lib/calendar-actions"
import { getCalendarEvents as getNewCalendarEvents } from "@/lib/calendar-event-actions"
import { getLeaveEventsForCalendar, type LeaveRequestRow } from "@/lib/leave-actions"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const EVENT_TYPE_STYLES: Record<string, { dot: string; bg: string }> = {
  meeting: { dot: "bg-success", bg: "bg-success/10 text-success border-success/20" },
  deadline: { dot: "bg-destructive", bg: "bg-destructive/10 text-destructive border-destructive/20" },
  reminder: { dot: "bg-info", bg: "bg-info/10 text-info border-info/20" },
  holiday: { dot: "bg-warning", bg: "bg-warning/10 text-warning border-warning/20" },
  other: { dot: "bg-muted-foreground", bg: "bg-muted text-muted-foreground border-border" },
  leave: { dot: "bg-warning", bg: "bg-warning/10 text-warning border-warning/20" },
}

const EVENT_TYPE_ICONS: Record<string, typeof Clock> = {
  meeting: Users,
  deadline: CalendarIcon,
  reminder: Clock,
  holiday: Palmtree,
  other: Briefcase,
}

type ViewMode = "month" | "week"

export default function CalendarPage() {
  const now = new Date()
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date>(now)
  const [events, setEvents] = useState<CalendarEventRow[]>([])
  const [myLeaves, setMyLeaves] = useState<LeaveRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Create event form
  const [newTitle, setNewTitle] = useState("")
  const [newType, setNewType] = useState<EventType>("meeting")
  const [newDate, setNewDate] = useState("")
  const [newStartTime, setNewStartTime] = useState("09:00")
  const [newEndTime, setNewEndTime] = useState("10:00")
  const [newLocation, setNewLocation] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

    console.log('[v0] Loading events for:', firstDay, 'to', lastDay)

    const [eventsResult, leavesResult] = await Promise.all([
      // Try new event system first, fall back to old if needed
      getNewCalendarEvents({
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
      }).catch(() => getCalendarEvents({
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
      })),
      getLeaveEventsForCalendar({
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
      }),
    ])

    if (eventsResult.error) {
      console.error('[v0] Error loading events:', eventsResult.error)
    } else if (eventsResult.events) {
      console.log('[v0] Loaded events:', eventsResult.events.length)
      setEvents(eventsResult.events)
    } else if (eventsResult.data) {
      setEvents(eventsResult.data)
    }
    
    if (leavesResult.data) setMyLeaves(leavesResult.data.myLeaves as LeaveRequestRow[])
    setLoading(false)
  }, [currentYear, currentMonth])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Navigation
  function goToPrevious() {
    if (viewMode === "month") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear((y) => y - 1)
      } else {
        setCurrentMonth((m) => m - 1)
      }
    } else {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() - 7)
      setSelectedDate(d)
      if (d.getMonth() !== currentMonth) {
        setCurrentMonth(d.getMonth())
        setCurrentYear(d.getFullYear())
      }
    }
  }

  function goToNext() {
    if (viewMode === "month") {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear((y) => y + 1)
      } else {
        setCurrentMonth((m) => m + 1)
      }
    } else {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() + 7)
      setSelectedDate(d)
      if (d.getMonth() !== currentMonth) {
        setCurrentMonth(d.getMonth())
        setCurrentYear(d.getFullYear())
      }
    }
  }

  // Calendar grid computation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  // Week view
  const weekStart = new Date(selectedDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekDays: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    weekDays.push(d)
  }

  // Helpers
  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  function isToday(day: number) {
    return day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()
  }

  function getEventsForDay(day: number): CalendarEventRow[] {
    const date = new Date(currentYear, currentMonth, day)
    const dateString = date.toDateString()
    
    // Normalize all dates to compare just the date part
    return events.filter((e) => {
      const eventStart = new Date(e.start_time).toDateString()
      const eventEnd = new Date(e.end_time).toDateString()
      
      // Event spans this day if event starts on or before this day AND ends on or after this day
      return eventStart <= dateString && eventEnd >= dateString
    })
  }

  function getLeavesForDay(day: number): LeaveRequestRow[] {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return myLeaves.filter((l) => l.start_date <= dateStr && l.end_date >= dateStr)
  }

  function getDotsForDay(day: number) {
    const dayEvents = getEventsForDay(day)
    const dayLeaves = getLeavesForDay(day)
    const dots: string[] = []
    const typesSeen = new Set<string>()
    dayEvents.forEach((e) => {
      if (!typesSeen.has(e.event_type)) {
        typesSeen.add(e.event_type)
        dots.push(EVENT_TYPE_STYLES[e.event_type]?.dot || EVENT_TYPE_STYLES.other.dot)
      }
    })
    if (dayLeaves.length > 0 && !typesSeen.has("leave")) {
      dots.push(EVENT_TYPE_STYLES.leave.dot)
    }
    return dots.slice(0, 3)
  }

  function getSelectedDayEvents() {
    return events.filter((e) => isSameDay(new Date(e.start_time), selectedDate))
  }

  function getSelectedDayLeaves() {
    const dateStr = selectedDate.toISOString().split("T")[0]
    return myLeaves.filter((l) => l.start_date <= dateStr && l.end_date >= dateStr)
  }

  const selectedEvents = getSelectedDayEvents()
  const selectedLeaves = getSelectedDayLeaves()

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })

  async function handleCreateEvent() {
    if (!newTitle.trim() || !newDate) return
    setCreating(true)
    const startTime = new Date(`${newDate}T${newStartTime}:00`).toISOString()
    const endTime = newEndTime ? new Date(`${newDate}T${newEndTime}:00`).toISOString() : undefined
    await createCalendarEvent({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      event_type: newType,
      start_time: startTime,
      end_time: endTime,
      location: newLocation.trim() || undefined,
    })
    setNewTitle("")
    setNewType("meeting")
    setNewDate("")
    setNewStartTime("09:00")
    setNewEndTime("10:00")
    setNewLocation("")
    setNewDescription("")
    setShowCreateDialog(false)
    setCreating(false)
    await loadEvents()
  }

  async function handleDeleteEvent(id: string) {
    await deleteCalendarEvent(id)
    await loadEvents()
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
            <button
              onClick={() => setViewMode("month")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${viewMode === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${viewMode === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Week
            </button>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)]">
              <DialogHeader>
                <DialogTitle>New Event</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Event title"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as EventType)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Location (optional)</Label>
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Office, Zoom, etc."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Additional details..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleCreateEvent} disabled={creating || !newTitle.trim() || !newDate} className="mt-1">
                  {creating ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Month/Year Navigation */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <span className="min-w-[140px] text-center text-sm font-semibold text-foreground">
          {viewMode === "month"
            ? `${monthName} ${currentYear}`
            : `${weekDays[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${weekDays[6].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-border bg-card p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1.5">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center justify-center py-1 text-[10px] font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {viewMode === "month" ? (
          /* Month View */
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="h-11" />
              const dots = getDotsForDay(day)
              const isSelected = day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()
              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                  className={`flex h-11 w-full flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                    isSelected
                      ? "bg-primary font-bold text-primary-foreground"
                      : isToday(day)
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted"
                  }`}
                >
                  {day}
                  {dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.map((dot, di) => (
                        <span key={di} className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground/80" : dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          /* Week View */
          <div className="grid grid-cols-7 gap-0.5">
            {weekDays.map((wd) => {
              const isSelected = isSameDay(wd, selectedDate)
              const isTodayDate = isSameDay(wd, now)
              const dayOfMonth = wd.getDate()
              // Only show dots if same month
              const dots = wd.getMonth() === currentMonth ? getDotsForDay(dayOfMonth) : []
              return (
                <button
                  key={wd.toISOString()}
                  onClick={() => setSelectedDate(new Date(wd))}
                  className={`flex h-16 w-full flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                    isSelected
                      ? "bg-primary font-bold text-primary-foreground"
                      : isTodayDate
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-[9px] font-medium opacity-60">
                    {wd.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  {dayOfMonth}
                  {dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.map((dot, di) => (
                        <span key={di} className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground/80" : dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {[
          { label: "Meeting", color: "bg-success" },
          { label: "Deadline", color: "bg-destructive" },
          { label: "Reminder", color: "bg-info" },
          { label: "Holiday", color: "bg-warning" },
          { label: "Leave", color: "bg-warning" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${l.color}`} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Events for selected day */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <Link href="/leave" className="text-xs font-medium text-primary">
            Request Leave
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : selectedEvents.length === 0 && selectedLeaves.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CalendarIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No events for this day</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* Leaves */}
            {selectedLeaves.map((leave) => (
              <div
                key={leave.id}
                className={`flex items-center gap-3 rounded-xl border p-3.5 ${EVENT_TYPE_STYLES.leave.bg}`}
              >
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${EVENT_TYPE_STYLES.leave.dot}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} Leave
                  </p>
                  <p className="text-[11px] opacity-70">
                    {new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {leave.status}
                </Badge>
              </div>
            ))}

            {/* Events */}
            {selectedEvents.map((event) => {
              const style = EVENT_TYPE_STYLES[event.event_type] || EVENT_TYPE_STYLES.other
              const Icon = EVENT_TYPE_ICONS[event.event_type] || Briefcase
              return (
                <div key={event.id} className={`flex items-start gap-3 rounded-xl border p-3.5 ${style.bg}`}>
                  <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 shrink-0 opacity-70" />
                      <p className="text-sm font-medium truncate">{event.title}</p>
                    </div>
                    {event.description && (
                      <p className="mt-0.5 text-[11px] opacity-70 line-clamp-2">{event.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] opacity-70">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(event.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {event.end_time && ` - ${new Date(event.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {event.location}
                        </span>
                      )}
                      {event.is_company_wide && (
                        <span className="flex items-center gap-0.5">
                          <Globe className="h-2.5 w-2.5" />
                          Company
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete event</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
