"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ============ CLOCK IN ============
export async function clockIn(data: {
  lat?: number
  lng?: number
  address?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check if already clocked in
  const { data: active } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "clocked_in")
    .maybeSingle()

  if (active) return { error: "Already clocked in" }

  const { data: record, error } = await supabase
    .from("attendance_records")
    .insert({
      user_id: user.id,
      clock_in: new Date().toISOString(),
      clock_in_lat: data.lat ?? null,
      clock_in_lng: data.lng ?? null,
      clock_in_address: data.address ?? null,
      status: "clocked_in",
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { data: record }
}

// ============ CLOCK OUT ============
export async function clockOut(data: {
  attendanceId: string
  lat?: number
  lng?: number
  address?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // End any active breaks first
  const { data: activeBreak } = await supabase
    .from("breaks")
    .select("id")
    .eq("attendance_id", data.attendanceId)
    .eq("user_id", user.id)
    .is("break_end", null)
    .maybeSingle()

  if (activeBreak) {
    const breakEnd = new Date()
    await supabase
      .from("breaks")
      .update({
        break_end: breakEnd.toISOString(),
      })
      .eq("id", activeBreak.id)
  }

  // Calculate total break minutes
  const { data: breaks } = await supabase
    .from("breaks")
    .select("break_start, break_end")
    .eq("attendance_id", data.attendanceId)

  let totalBreakMinutes = 0
  if (breaks) {
    for (const b of breaks) {
      if (b.break_start && b.break_end) {
        const start = new Date(b.break_start).getTime()
        const end = new Date(b.break_end).getTime()
        totalBreakMinutes += Math.round((end - start) / 60000)
      }
    }
  }

  // Get clock-in time
  const { data: record } = await supabase
    .from("attendance_records")
    .select("clock_in")
    .eq("id", data.attendanceId)
    .single()

  const clockInTime = record?.clock_in ? new Date(record.clock_in).getTime() : Date.now()
  const clockOutTime = Date.now()
  const totalHours = Math.round(((clockOutTime - clockInTime) / 3600000 - totalBreakMinutes / 60) * 100) / 100

  const { error } = await supabase
    .from("attendance_records")
    .update({
      clock_out: new Date().toISOString(),
      clock_out_lat: data.lat ?? null,
      clock_out_lng: data.lng ?? null,
      clock_out_address: data.address ?? null,
      status: "clocked_out",
      total_hours: Math.max(0, totalHours),
      total_break_minutes: totalBreakMinutes,
    })
    .eq("id", data.attendanceId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

// ============ START BREAK ============
export async function startBreak(data: {
  attendanceId: string
  breakType?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check no active break
  const { data: active } = await supabase
    .from("breaks")
    .select("id")
    .eq("attendance_id", data.attendanceId)
    .eq("user_id", user.id)
    .is("break_end", null)
    .maybeSingle()

  if (active) return { error: "Already on a break" }

  const { data: breakRecord, error } = await supabase
    .from("breaks")
    .insert({
      attendance_id: data.attendanceId,
      user_id: user.id,
      break_start: new Date().toISOString(),
      break_type: data.breakType ?? "general",
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { data: breakRecord }
}

// ============ END BREAK ============
export async function endBreak(data: { breakId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const breakEnd = new Date()
  
  // Get break start to calculate duration
  const { data: breakRecord } = await supabase
    .from("breaks")
    .select("break_start")
    .eq("id", data.breakId)
    .single()

  const durationMinutes = breakRecord?.break_start
    ? Math.round((breakEnd.getTime() - new Date(breakRecord.break_start).getTime()) / 60000)
    : 0

  const { error } = await supabase
    .from("breaks")
    .update({
      break_end: breakEnd.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq("id", data.breakId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

// ============ GET ACTIVE SESSION ============
export async function getActiveSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: session } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "clocked_in")
    .order("clock_in", { ascending: false })
    .maybeSingle()

  if (!session) return { data: null }

  // Get active break
  const { data: activeBreak } = await supabase
    .from("breaks")
    .select("*")
    .eq("attendance_id", session.id)
    .is("break_end", null)
    .maybeSingle()

  // Get all breaks for this session
  const { data: breaks } = await supabase
    .from("breaks")
    .select("*")
    .eq("attendance_id", session.id)
    .order("break_start", { ascending: true })

  return {
    data: {
      ...session,
      activeBreak,
      breaks: breaks ?? [],
    },
  }
}

// ============ GET TODAY'S ATTENDANCE ============
export async function getTodayAttendance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*, breaks(*)")
    .eq("user_id", user.id)
    .gte("clock_in", today.toISOString())
    .lt("clock_in", tomorrow.toISOString())
    .order("clock_in", { ascending: false })

  return { data: records ?? [] }
}

// ============ GET ATTENDANCE HISTORY ============
export async function getAttendanceHistory(params?: {
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const limit = params?.limit ?? 20
  const page = params?.page ?? 0
  const offset = page * limit

  let query = supabase
    .from("attendance_records")
    .select("*, breaks(*)", { count: "exact" })
    .eq("user_id", user.id)
    .order("clock_in", { ascending: false })
    .range(offset, offset + limit - 1)

  if (params?.startDate) {
    query = query.gte("clock_in", params.startDate)
  }
  if (params?.endDate) {
    query = query.lte("clock_in", params.endDate)
  }

  const { data, count, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [], count: count ?? 0 }
}

// ============ SUBMIT MANUAL ATTENDANCE ============
export async function submitManualAttendance(data: {
  requestedDate: string
  clockInTime: string
  clockOutTime: string
  reason: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("manual_attendance_requests")
    .insert({
      user_id: user.id,
      requested_date: data.requestedDate,
      clock_in_time: data.clockInTime,
      clock_out_time: data.clockOutTime,
      reason: data.reason,
    })

  if (error) return { error: error.message }
  revalidatePath("/attendance")
  return { success: true }
}

// ============ GET MANUAL REQUESTS ============
export async function getManualRequests(statusFilter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  let query = supabase
    .from("manual_attendance_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

// ============ ADMIN: REVIEW MANUAL REQUEST ============
export async function reviewManualRequest(data: {
  requestId: string
  status: "approved" | "rejected"
  reviewNotes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { error: "Unauthorized" }

  // Update request
  const { error: updateError } = await supabase
    .from("manual_attendance_requests")
    .update({
      status: data.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: data.reviewNotes ?? null,
    })
    .eq("id", data.requestId)

  if (updateError) return { error: updateError.message }

  // If approved, create actual attendance record
  if (data.status === "approved") {
    const { data: request } = await supabase
      .from("manual_attendance_requests")
      .select("*")
      .eq("id", data.requestId)
      .single()

    if (request) {
      const clockIn = new Date(request.clock_in_time)
      const clockOut = new Date(request.clock_out_time)
      const totalHours = Math.round(((clockOut.getTime() - clockIn.getTime()) / 3600000) * 100) / 100

      await supabase
        .from("attendance_records")
        .insert({
          user_id: request.user_id,
          clock_in: request.clock_in_time,
          clock_out: request.clock_out_time,
          status: "clocked_out",
          total_hours: totalHours,
          is_manual: true,
          notes: `Manual entry: ${request.reason}`,
        })
    }
  }

  revalidatePath("/admin")
  revalidatePath("/attendance")
  return { success: true }
}

// ============ ADMIN: GET ALL ATTENDANCE (for reports) ============
export async function getAdminAttendanceReport(params?: {
  startDate?: string
  endDate?: string
  userId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { error: "Unauthorized" }

  let query = supabase
    .from("attendance_records")
    .select("*, profiles!attendance_records_user_id_fkey(first_name, last_name, email, department)")
    .order("clock_in", { ascending: false })
    .limit(100)

  if (params?.startDate) {
    query = query.gte("clock_in", params.startDate)
  }
  if (params?.endDate) {
    query = query.lte("clock_in", params.endDate)
  }
  if (params?.userId) {
    query = query.eq("user_id", params.userId)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

// ============ ADMIN: GET ALL MANUAL REQUESTS ============
export async function getAdminManualRequests(statusFilter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { error: "Unauthorized" }

  let query = supabase
    .from("manual_attendance_requests")
    .select("*, profiles!manual_attendance_requests_user_id_fkey(first_name, last_name, email, department)")
    .order("created_at", { ascending: false })

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

// ============ GET WEEKLY STATS ============
export async function getWeeklyStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const { data: records } = await supabase
    .from("attendance_records")
    .select("clock_in, clock_out, total_hours, total_break_minutes, status")
    .eq("user_id", user.id)
    .gte("clock_in", startOfWeek.toISOString())
    .order("clock_in", { ascending: true })

  const totalHours = records?.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) ?? 0
  const totalBreakMinutes = records?.reduce((sum, r) => sum + (r.total_break_minutes ?? 0), 0) ?? 0
  const daysWorked = new Set(records?.map(r => new Date(r.clock_in).toDateString())).size

  // Build daily breakdown
  const dailyBreakdown: Record<string, number> = {}
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    dailyBreakdown[dayNames[i]] = 0
  }
  records?.forEach((r) => {
    const day = dayNames[new Date(r.clock_in).getDay()]
    dailyBreakdown[day] += r.total_hours ?? 0
  })

  return {
    data: {
      totalHours: Math.round(totalHours * 100) / 100,
      totalBreakMinutes,
      daysWorked,
      recordCount: records?.length ?? 0,
      dailyBreakdown,
    },
  }
}
