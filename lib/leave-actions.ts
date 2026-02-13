"use server"

import { createClient } from "@/lib/supabase/server"

// ==================== TYPES ====================
export type LeaveType = "casual" | "sick" | "earned" | "unpaid" | "maternity" | "paternity" | "compensatory"
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled"

export interface LeaveRequestRow {
  id: string
  user_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  days_count: number
  created_at: string
  updated_at: string
  profiles?: { first_name: string | null; last_name: string | null; email: string | null; department: string | null } | null
  reviewer?: { first_name: string | null; last_name: string | null } | null
}

export interface LeaveBalanceRow {
  id: string
  user_id: string
  leave_type: string
  total_days: number
  used_days: number
  year: number
}

// ==================== GET MY LEAVE REQUESTS ====================
export async function getMyLeaveRequests(status?: LeaveStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  let query = supabase
    .from("leave_requests")
    .select("*, reviewer:reviewed_by(first_name, last_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  return { data: data as LeaveRequestRow[] | null, error: error?.message || null }
}

// ==================== GET MY LEAVE BALANCES ====================
export async function getMyLeaveBalances() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const currentYear = new Date().getFullYear()

  const { data, error } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", currentYear)

  // If no balances exist, create defaults
  if (!error && (!data || data.length === 0)) {
    const defaults: { leave_type: string; total_days: number }[] = [
      { leave_type: "casual", total_days: 12 },
      { leave_type: "sick", total_days: 12 },
      { leave_type: "earned", total_days: 15 },
    ]

    const { data: newData, error: insertError } = await supabase
      .from("leave_balances")
      .insert(
        defaults.map((d) => ({
          user_id: user.id,
          leave_type: d.leave_type,
          total_days: d.total_days,
          used_days: 0,
          year: currentYear,
        }))
      )
      .select()

    if (insertError) return { data: null, error: insertError.message }
    return { data: newData as LeaveBalanceRow[], error: null }
  }

  return { data: data as LeaveBalanceRow[] | null, error: error?.message || null }
}

// ==================== CREATE LEAVE REQUEST ====================
export async function createLeaveRequest(params: {
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  // Calculate days count
  const start = new Date(params.start_date)
  const end = new Date(params.end_date)
  if (end < start) return { data: null, error: "End date must be after start date" }
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  // Check overlap with existing approved/pending requests
  const { data: overlap } = await supabase
    .from("leave_requests")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .lte("start_date", params.end_date)
    .gte("end_date", params.start_date)
    .limit(1)

  if (overlap && overlap.length > 0) {
    return { data: null, error: "You already have a leave request overlapping these dates" }
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      user_id: user.id,
      leave_type: params.leave_type,
      start_date: params.start_date,
      end_date: params.end_date,
      reason: params.reason,
      days_count: daysCount,
      status: "pending",
    })
    .select()
    .single()

  if (!error) {
    // Notify admins
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single()

    const name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "An employee"

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: "New Leave Request",
          message: `${name} has requested ${daysCount} day(s) of ${params.leave_type} leave`,
          type: "leave_request",
        }))
      )
    }
  }

  return { data, error: error?.message || null }
}

// ==================== CANCEL MY LEAVE REQUEST ====================
export async function cancelLeaveRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending")

  return { error: error?.message || null }
}

// ==================== ADMIN: GET ALL LEAVE REQUESTS ====================
export async function getAdminLeaveRequests(status?: LeaveStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return { data: null, error: "Not authorized" }

  let query = supabase
    .from("leave_requests")
    .select("*, profiles:user_id(first_name, last_name, email, department), reviewer:reviewed_by(first_name, last_name)")
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  return { data: data as LeaveRequestRow[] | null, error: error?.message || null }
}

// ==================== ADMIN: REVIEW LEAVE REQUEST ====================
export async function reviewLeaveRequest(params: {
  requestId: string
  status: "approved" | "rejected"
  reviewNotes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return { error: "Not authorized" }

  // Get the leave request to know days and user
  const { data: request } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", params.requestId)
    .single()

  if (!request) return { error: "Request not found" }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: params.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: params.reviewNotes || null,
    })
    .eq("id", params.requestId)

  if (!error) {
    // If approved, update leave balance
    if (params.status === "approved") {
      const currentYear = new Date().getFullYear()
      const { data: balance } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("user_id", request.user_id)
        .eq("leave_type", request.leave_type)
        .eq("year", currentYear)
        .single()

      if (balance) {
        await supabase
          .from("leave_balances")
          .update({ used_days: balance.used_days + request.days_count })
          .eq("id", balance.id)
      }
    }

    // Notify the employee
    const reviewerName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Admin"
    await supabase.from("notifications").insert({
      user_id: request.user_id,
      title: `Leave ${params.status === "approved" ? "Approved" : "Rejected"}`,
      message: `Your ${request.leave_type} leave request (${request.days_count} day${request.days_count > 1 ? "s" : ""}) has been ${params.status} by ${reviewerName}${params.reviewNotes ? `: ${params.reviewNotes}` : ""}`,
      type: "leave_update",
    })
  }

  return { error: error?.message || null }
}

// ==================== GET TEAM AVAILABILITY ====================
export async function getTeamAvailability(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  // Get approved leaves that cover this date
  const { data: leaves, error } = await supabase
    .from("leave_requests")
    .select("*, profiles:user_id(first_name, last_name, department)")
    .eq("status", "approved")
    .lte("start_date", date)
    .gte("end_date", date)

  return { data: leaves, error: error?.message || null }
}

// ==================== GET LEAVE REQUESTS FOR CALENDAR ====================
export async function getLeaveEventsForCalendar(params: {
  startDate: string
  endDate: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  // User's own leaves (all statuses)
  const { data: myLeaves } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .lte("start_date", params.endDate)
    .gte("end_date", params.startDate)

  // Team approved leaves (for admins, get all; for employees, get approved)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  let teamLeaves: LeaveRequestRow[] = []
  if (profile?.role === "admin") {
    const { data } = await supabase
      .from("leave_requests")
      .select("*, profiles:user_id(first_name, last_name, email, department)")
      .in("status", ["pending", "approved"])
      .lte("start_date", params.endDate)
      .gte("end_date", params.startDate)

    teamLeaves = (data || []) as LeaveRequestRow[]
  }

  return {
    data: { myLeaves: myLeaves || [], teamLeaves },
    error: null,
  }
}
