"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { clockIn, clockOut, startBreak, endBreak } from "@/lib/attendance-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Square,
  Coffee,
  MapPin,
  Clock,
  Timer,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface AttendanceSession {
  id: string
  clock_in: string
  clock_in_address?: string
  status: string
  activeBreak?: {
    id: string
    break_start: string
    break_type: string
  } | null
  breaks: Array<{
    id: string
    break_start: string
    break_end: string | null
    break_type: string
    duration_minutes: number | null
  }>
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ClockWidget() {
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [breakElapsed, setBreakElapsed] = useState(0)
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number
    lng: number
    address?: string
  } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [breakType, setBreakType] = useState("lunch")
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { toast } = useToast()

  // Fetch active session
  const fetchSession = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: active } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "clocked_in")
        .order("clock_in", { ascending: false })
        .maybeSingle()

      if (active) {
        // Get active break
        const { data: activeBreak } = await supabase
          .from("breaks")
          .select("*")
          .eq("attendance_id", active.id)
          .is("break_end", null)
          .maybeSingle()

        // Get all breaks
        const { data: breaks } = await supabase
          .from("breaks")
          .select("*")
          .eq("attendance_id", active.id)
          .order("break_start", { ascending: true })

        setSession({
          ...active,
          activeBreak: activeBreak ?? null,
          breaks: breaks ?? [],
        })
      } else {
        setSession(null)
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Timer for elapsed time
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - new Date(session.clock_in).getTime())
      if (session.activeBreak) {
        setBreakElapsed(
          Date.now() - new Date(session.activeBreak.break_start).getTime()
        )
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [session])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Get GPS location
  const getLocation = useCallback(async (): Promise<{
    lat: number
    lng: number
    address?: string
  } | null> => {
    setGpsLoading(true)
    setGpsError(null)
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsError("Geolocation not supported")
        setGpsLoading(false)
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
          setGpsLocation(loc)
          setGpsLoading(false)
          resolve(loc)
        },
        (err) => {
          setGpsError(
            err.code === 1
              ? "Location access denied. Please enable GPS."
              : "Unable to get location."
          )
          setGpsLoading(false)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }, [])

  // CLOCK IN
  const handleClockIn = async () => {
    setActionLoading(true)
    const loc = await getLocation()
    const result = await clockIn({
      lat: loc?.lat,
      lng: loc?.lng,
      address: loc?.address,
    })
    if (result.error) {
      toast({
        title: "Clock-in failed",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({ title: "Clocked in successfully" })
      await fetchSession()
    }
    setActionLoading(false)
  }

  // CLOCK OUT
  const handleClockOut = async () => {
    if (!session) return
    setShowClockOutConfirm(false)
    setActionLoading(true)
    const loc = await getLocation()
    const result = await clockOut({
      attendanceId: session.id,
      lat: loc?.lat,
      lng: loc?.lng,
      address: loc?.address,
    })
    if (result.error) {
      toast({
        title: "Clock-out failed",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({ title: "Clocked out successfully" })
      setSession(null)
      setElapsed(0)
    }
    setActionLoading(false)
  }

  // START BREAK
  const handleStartBreak = async () => {
    if (!session) return
    setActionLoading(true)
    const result = await startBreak({
      attendanceId: session.id,
      breakType,
    })
    if (result.error) {
      toast({
        title: "Break start failed",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({ title: `${breakType} break started` })
      await fetchSession()
    }
    setActionLoading(false)
  }

  // END BREAK
  const handleEndBreak = async () => {
    if (!session?.activeBreak) return
    setActionLoading(true)
    const result = await endBreak({ breakId: session.activeBreak.id })
    if (result.error) {
      toast({
        title: "End break failed",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({ title: "Break ended" })
      setBreakElapsed(0)
      await fetchSession()
    }
    setActionLoading(false)
  }

  // Total break time for the session
  const totalBreakMs =
    session?.breaks.reduce((sum, b) => {
      if (b.break_end) {
        return (
          sum +
          (new Date(b.break_end).getTime() -
            new Date(b.break_start).getTime())
        )
      }
      return sum
    }, 0) ?? 0

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden border-border/50">
        {/* Status bar */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 ${
            session
              ? session.activeBreak
                ? "bg-warning/10 text-warning-foreground"
                : "bg-success/10 text-success-foreground"
              : "bg-muted/50 text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <div
              className={`h-2 w-2 rounded-full ${
                session
                  ? session.activeBreak
                    ? "animate-pulse bg-warning"
                    : "animate-pulse bg-success"
                  : "bg-muted-foreground/50"
              }`}
            />
            {session
              ? session.activeBreak
                ? "On Break"
                : "Currently Working"
              : "Not Clocked In"}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-success" />
                <span className="text-success">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-destructive" />
                <span className="text-destructive">Offline</span>
              </>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {session ? (
            <div className="flex flex-col gap-4">
              {/* Timer display */}
              <div className="text-center">
                <p className="font-mono text-4xl font-bold tracking-wider text-foreground">
                  {formatElapsed(elapsed)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Clocked in at {formatTime(session.clock_in)}
                </p>
              </div>

              {/* Break timer */}
              {session.activeBreak && (
                <div className="rounded-lg bg-warning/10 p-3 text-center">
                  <p className="text-xs font-medium text-warning">
                    {session.activeBreak.break_type.charAt(0).toUpperCase() +
                      session.activeBreak.break_type.slice(1)}{" "}
                    Break
                  </p>
                  <p className="font-mono text-xl font-bold text-warning">
                    {formatElapsed(breakElapsed)}
                  </p>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">Working</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatElapsed(elapsed - totalBreakMs - (session.activeBreak ? breakElapsed : 0))}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Coffee className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">Breaks</p>
                  <p className="text-sm font-semibold text-foreground">
                    {session.breaks.length}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Timer className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Break Time
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {Math.round((totalBreakMs + (session.activeBreak ? breakElapsed : 0)) / 60000)}m
                  </p>
                </div>
              </div>

              {/* GPS info */}
              {session.clock_in_address && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{session.clock_in_address}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {session.activeBreak ? (
                  <Button
                    onClick={handleEndBreak}
                    disabled={actionLoading}
                    className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    End Break
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={breakType} onValueChange={setBreakType}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="tea">Tea/Coffee</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleStartBreak}
                      disabled={actionLoading}
                      className="shrink-0"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Coffee className="mr-2 h-4 w-4" />
                      )}
                      Break
                    </Button>
                  </div>
                )}

                <Button
                  variant="destructive"
                  onClick={() => setShowClockOutConfirm(true)}
                  disabled={actionLoading || !!session.activeBreak}
                  className="w-full"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="mr-2 h-4 w-4" />
                  )}
                  Clock Out
                </Button>
              </div>

              {/* Break history */}
              {session.breaks.length > 0 && (
                <div className="border-t border-border/50 pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Break History
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {session.breaks.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-xs"
                      >
                        <span className="font-medium capitalize text-foreground">
                          {b.break_type}
                        </span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{formatTime(b.break_start)}</span>
                          <span>-</span>
                          <span>
                            {b.break_end ? formatTime(b.break_end) : "Active"}
                          </span>
                          {b.duration_minutes != null && (
                            <Badge variant="secondary" className="ml-1 text-[10px]">
                              {b.duration_minutes}m
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-muted/50 p-4">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Ready to start your day?
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  GPS location will be recorded on clock-in
                </p>
              </div>

              {gpsError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {gpsError}
                </div>
              )}

              <Button
                size="lg"
                onClick={handleClockIn}
                disabled={actionLoading || gpsLoading}
                className="w-full"
              >
                {actionLoading || gpsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {gpsLoading ? "Getting Location..." : "Clock In"}
              </Button>

              {gpsLocation && (
                <div className="flex items-center gap-1.5 text-xs text-success">
                  <MapPin className="h-3.5 w-3.5" />
                  Location captured
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clock Out Confirmation */}
      <AlertDialog
        open={showClockOutConfirm}
        onOpenChange={setShowClockOutConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clock Out?</AlertDialogTitle>
            <AlertDialogDescription>
              You have been working for{" "}
              <span className="font-semibold text-foreground">
                {formatElapsed(elapsed)}
              </span>
              . Are you sure you want to clock out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClockOut}>
              Clock Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
