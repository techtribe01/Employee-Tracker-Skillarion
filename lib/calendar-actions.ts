"use server"

import { createClient } from "@/lib/supabase/server"

// ==================== TYPES ====================
export type EventType = "meeting" | "deadline" | "reminder" | "holiday" | "other"

export interface CalendarEventRow {
  id: string
  title: string
  description: string | null
  event_type: EventType
  start_time: string
  end_time: string | null
  all_day: boolean
  location: string | null
  color: string | null
  created_by: string
  is_company_wide: boolean
  department: string | null
  created_at: string
  updated_at: string
  creator?: { first_name: string | null; last_name: string | null } | null
}

// ==================== FETCH EVENTS ====================
export async function getCalendarEvents(params: {
  startDate: string
  endDate: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*, creator:created_by(first_name, last_name)")
    .gte("start_time", params.startDate)
    .lte("start_time", params.endDate)
    .order("start_time", { ascending: true })

  return { data: data as CalendarEventRow[] | null, error: error?.message || null }
}

// ==================== CREATE EVENT ====================
export async function createCalendarEvent(params: {
  title: string
  description?: string
  event_type: EventType
  start_time: string
  end_time?: string
  all_day?: boolean
  location?: string
  color?: string
  is_company_wide?: boolean
  department?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: params.title,
      description: params.description || null,
      event_type: params.event_type,
      start_time: params.start_time,
      end_time: params.end_time || null,
      all_day: params.all_day || false,
      location: params.location || null,
      color: params.color || null,
      created_by: user.id,
      is_company_wide: params.is_company_wide || false,
      department: params.department || null,
    })
    .select()
    .single()

  return { data, error: error?.message || null }
}

// ==================== UPDATE EVENT ====================
export async function updateCalendarEvent(params: {
  id: string
  title?: string
  description?: string
  event_type?: EventType
  start_time?: string
  end_time?: string
  all_day?: boolean
  location?: string
  color?: string
  is_company_wide?: boolean
  department?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const updates: Record<string, unknown> = {}
  if (params.title !== undefined) updates.title = params.title
  if (params.description !== undefined) updates.description = params.description
  if (params.event_type !== undefined) updates.event_type = params.event_type
  if (params.start_time !== undefined) updates.start_time = params.start_time
  if (params.end_time !== undefined) updates.end_time = params.end_time
  if (params.all_day !== undefined) updates.all_day = params.all_day
  if (params.location !== undefined) updates.location = params.location
  if (params.color !== undefined) updates.color = params.color
  if (params.is_company_wide !== undefined) updates.is_company_wide = params.is_company_wide
  if (params.department !== undefined) updates.department = params.department

  const { data, error } = await supabase
    .from("calendar_events")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  return { data, error: error?.message || null }
}

// ==================== DELETE EVENT ====================
export async function deleteCalendarEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)

  return { error: error?.message || null }
}

// ==================== ADMIN: CREATE COMPANY EVENT ====================
export async function createCompanyEvent(params: {
  title: string
  description?: string
  event_type: EventType
  start_time: string
  end_time?: string
  all_day?: boolean
  color?: string
  department?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return { data: null, error: "Not authorized" }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: params.title,
      description: params.description || null,
      event_type: params.event_type,
      start_time: params.start_time,
      end_time: params.end_time || null,
      all_day: params.all_day || false,
      color: params.color || null,
      created_by: user.id,
      is_company_wide: !params.department,
      department: params.department || null,
    })
    .select()
    .single()

  return { data, error: error?.message || null }
}
