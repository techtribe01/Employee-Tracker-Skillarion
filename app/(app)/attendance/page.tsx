"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { submitManualAttendance } from "@/lib/attendance-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Clock,
  MapPin,
  Calendar,
  Coffee,
  FileText,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface AttendanceRecord {
  id: string
  clock_in: string
  clock_out: string | null
  clock_in_address: string | null
  clock_out_address: string | null
  status: string
  total_hours: number | null
  total_break_minutes: number | null
  is_manual: boolean
  notes: string | null
  breaks: Array<{
    id: string
    break_start: string
    break_end: string | null
    break_type: string
    duration_minutes: number | null
  }>
}

interface ManualRequest {
  id: string
  requested_date: string
  clock_in_time: string
  clock_out_time: string
  reason: string
  status: string
  review_notes: string | null
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusColor(status: string) {
  switch (status) {
    case "clocked_out":
      return "bg-success/10 text-success border-success/20"
    case "clocked_in":
      return "bg-primary/10 text-primary border-primary/20"
    case "approved":
      return "bg-success/10 text-success border-success/20"
    case "pending":
      return "bg-warning/10 text-warning border-warning/20"
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "clocked_out":
      return "Completed"
    case "clocked_in":
      return "Active"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")
  }
}

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Attendance</h1>
          <p className="text-xs text-muted-foreground">
            History & manual entries
          </p>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" className="text-xs">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            History
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <AttendanceHistory />
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <ManualEntrySection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================== ATTENDANCE HISTORY ====================
function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const offset = page * limit
      const { data, count } = await supabase
        .from("attendance_records")
        .select("*, breaks(*)", { count: "exact" })
        .eq("user_id", user.id)
        .order("clock_in", { ascending: false })
        .range(offset, offset + limit - 1)

      setRecords(data ?? [])
      setTotalCount(count ?? 0)
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const totalPages = Math.ceil(totalCount / limit)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted/50 p-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          No attendance records yet
        </p>
        <p className="text-xs text-muted-foreground">
          Clock in from the dashboard to start tracking
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {records.map((record) => (
        <Card key={record.id} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(record.clock_in)}
                  </span>
                  {record.is_manual && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-info/20 bg-info/10 text-info"
                    >
                      Manual
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {formatTime(record.clock_in)}
                    {record.clock_out
                      ? ` - ${formatTime(record.clock_out)}`
                      : " - Active"}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] ${statusColor(record.status)}`}
              >
                {statusLabel(record.status)}
              </Badge>
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-4 text-xs">
              {record.total_hours != null && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium text-foreground">
                    {record.total_hours}h
                  </span>
                  worked
                </div>
              )}
              {(record.total_break_minutes ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Coffee className="h-3 w-3" />
                  <span className="font-medium text-foreground">
                    {record.total_break_minutes}m
                  </span>
                  break
                </div>
              )}
              {record.breaks.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  {record.breaks.length} break
                  {record.breaks.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* GPS */}
            {record.clock_in_address && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{record.clock_in_address}</span>
              </div>
            )}

            {/* Notes */}
            {record.notes && (
              <p className="mt-2 text-xs text-muted-foreground italic">
                {record.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ==================== MANUAL ENTRY ====================
function ManualEntrySection() {
  const [requests, setRequests] = useState<ManualRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    requestedDate: "",
    clockInTime: "",
    clockOutTime: "",
    reason: "",
  })
  const { toast } = useToast()

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("manual_attendance_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setRequests(data ?? [])
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSubmit = async () => {
    if (
      !formData.requestedDate ||
      !formData.clockInTime ||
      !formData.clockOutTime ||
      !formData.reason.trim()
    ) {
      toast({
        title: "All fields required",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    // Build full ISO timestamps
    const clockIn = new Date(
      `${formData.requestedDate}T${formData.clockInTime}`
    ).toISOString()
    const clockOut = new Date(
      `${formData.requestedDate}T${formData.clockOutTime}`
    ).toISOString()

    if (clockOut <= clockIn) {
      toast({
        title: "Invalid times",
        description: "Clock-out must be after clock-in.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    const result = await submitManualAttendance({
      requestedDate: formData.requestedDate,
      clockInTime: clockIn,
      clockOutTime: clockOut,
      reason: formData.reason.trim(),
    })

    if (result.error) {
      toast({
        title: "Submission failed",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({ title: "Manual entry submitted for approval" })
      setFormData({
        requestedDate: "",
        clockInTime: "",
        clockOutTime: "",
        reason: "",
      })
      setShowForm(false)
      fetchRequests()
    }
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Send className="mr-2 h-4 w-4" />
          Submit Manual Entry
        </Button>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col gap-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              New Manual Entry
            </h3>
            <p className="text-xs text-muted-foreground">
              Submit a manual attendance entry for admin approval. Use this when
              you forgot to clock in/out.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date" className="text-xs">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.requestedDate}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      requestedDate: e.target.value,
                    }))
                  }
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="clockIn" className="text-xs">
                    Clock In
                  </Label>
                  <Input
                    id="clockIn"
                    type="time"
                    value={formData.clockInTime}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        clockInTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="clockOut" className="text-xs">
                    Clock Out
                  </Label>
                  <Input
                    id="clockOut"
                    type="time"
                    value={formData.clockOutTime}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        clockOutTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason" className="text-xs">
                  Reason
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need a manual entry..."
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, reason: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past requests */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Your Requests
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              No manual entry requests yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((req) => (
              <Card key={req.id} className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {new Date(req.requested_date).toLocaleDateString(
                          "en-IN",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(req.clock_in_time)} -{" "}
                        {formatTime(req.clock_out_time)}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColor(req.status)}`}
                    >
                      {req.status.charAt(0).toUpperCase() +
                        req.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {req.reason}
                  </p>
                  {req.review_notes && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      Admin: {req.review_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
