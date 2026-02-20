"use server"

import { createClient } from "@/lib/supabase/server"

// ==================== TYPES ====================
export type TaskStatus = "not_started" | "in_progress" | "under_review" | "completed"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type VerificationStatus = "unverified" | "verified" | "rejected"

export interface TaskRow {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string
  status: TaskStatus
  priority: TaskPriority
  category: string | null
  due_date: string | null
  started_at: string | null
  completed_at: string | null
  estimated_hours: number | null
  actual_hours: number | null
  verification_status: VerificationStatus
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  created_at: string
  updated_at: string
  // joined
  assignee?: { first_name: string | null; last_name: string | null; email: string | null; department: string | null } | null
  creator?: { first_name: string | null; last_name: string | null; email: string | null } | null
}

export interface CommentRow {
  id: string
  task_id: string
  user_id: string
  content: string
  is_system: boolean
  created_at: string
  updated_at: string
  profiles?: { first_name: string | null; last_name: string | null; email: string | null } | null
}

export interface AttachmentRow {
  id: string
  task_id: string
  user_id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  created_at: string
}

export interface NotificationRow {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  related_task_id: string | null
  is_read: boolean
  created_at: string
}

// ==================== HELPERS ====================
async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null, error: "Not authenticated" }
  return { supabase, user, error: null }
}

async function createNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedTaskId?: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    related_task_id: relatedTaskId || null,
  })
}

// ==================== TASK CRUD ====================

export async function createTask(params: {
  title: string
  description?: string
  assigned_to?: string
  priority?: TaskPriority
  category?: string
  due_date?: string
  estimated_hours?: number
}) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: params.title,
      description: params.description || null,
      assigned_to: params.assigned_to || null,
      created_by: user.id,
      priority: params.priority || "medium",
      category: params.category || null,
      due_date: params.due_date || null,
      estimated_hours: params.estimated_hours || null,
      status: "not_started",
      verification_status: "unverified",
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Notify assignee
  if (params.assigned_to && params.assigned_to !== user.id) {
    await createNotification(
      supabase,
      params.assigned_to,
      "New Task Assigned",
      `You have been assigned: "${params.title}"`,
      "task_assigned",
      data.id
    )
  }

  // Add system comment
  await supabase.from("task_comments").insert({
    task_id: data.id,
    user_id: user.id,
    content: "Task created",
    is_system: true,
  })

  return { data, error: null }
}

export async function getMyTasks(filters?: {
  status?: string
  priority?: string
}) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  let query = supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email, department), creator:profiles!tasks_created_by_fkey(first_name, last_name, email)")
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
    .order("created_at", { ascending: false })

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  if (filters?.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as TaskRow[], error: null }
}

export async function getAllTasks(filters?: {
  status?: string
  priority?: string
  assigned_to?: string
}) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  let query = supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email, department), creator:profiles!tasks_created_by_fkey(first_name, last_name, email)")
    .order("created_at", { ascending: false })

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  if (filters?.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority)
  }
  if (filters?.assigned_to && filters.assigned_to !== "all") {
    query = query.eq("assigned_to", filters.assigned_to)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as TaskRow[], error: null }
}

export async function getTaskById(taskId: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email, department), creator:profiles!tasks_created_by_fkey(first_name, last_name, email)")
    .eq("id", taskId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as TaskRow, error: null }
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const updates: Record<string, unknown> = { status: newStatus }

  if (newStatus === "in_progress") {
    updates.started_at = new Date().toISOString()
  } else if (newStatus === "completed") {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select("*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email, department), creator:profiles!tasks_created_by_fkey(first_name, last_name, email)")
    .single()

  if (error) return { data: null, error: error.message }

  const statusLabels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    under_review: "Under Review",
    completed: "Completed",
  }

  // System comment
  await supabase.from("task_comments").insert({
    task_id: taskId,
    user_id: user.id,
    content: `Status changed to "${statusLabels[newStatus] || newStatus}"`,
    is_system: true,
  })

  // Notify creator if assignee changes status
  if (data.created_by && data.created_by !== user.id) {
    await createNotification(
      supabase,
      data.created_by,
      "Task Status Updated",
      `"${data.title}" is now ${statusLabels[newStatus] || newStatus}`,
      "task_status_change",
      taskId
    )
  }

  // Notify assignee if admin changes status
  if (data.assigned_to && data.assigned_to !== user.id) {
    await createNotification(
      supabase,
      data.assigned_to,
      "Task Status Updated",
      `"${data.title}" is now ${statusLabels[newStatus] || newStatus}`,
      "task_status_change",
      taskId
    )
  }

  return { data: data as TaskRow, error: null }
}

export async function updateTask(taskId: string, params: {
  title?: string
  description?: string
  assigned_to?: string | null
  priority?: TaskPriority
  category?: string
  due_date?: string | null
  estimated_hours?: number | null
  actual_hours?: number | null
}) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("tasks")
    .update(params)
    .eq("id", taskId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteTask(taskId: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { error: authError }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) return { error: error.message }
  return { error: null }
}

// ==================== VERIFICATION ====================

export async function verifyTask(taskId: string, status: "verified" | "rejected", notes?: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const updates: Record<string, unknown> = {
    verification_status: status,
    verified_by: user.id,
    verified_at: new Date().toISOString(),
    verification_notes: notes || null,
  }

  if (status === "rejected") {
    updates.status = "in_progress"
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select("*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email, department)")
    .single()

  if (error) return { data: null, error: error.message }

  // System comment
  await supabase.from("task_comments").insert({
    task_id: taskId,
    user_id: user.id,
    content: status === "verified"
      ? `Work verified${notes ? `: ${notes}` : ""}`
      : `Work rejected and sent back${notes ? `: ${notes}` : ""}`,
    is_system: true,
  })

  // Notify assignee
  if (data.assigned_to) {
    await createNotification(
      supabase,
      data.assigned_to,
      status === "verified" ? "Task Verified" : "Task Rejected",
      status === "verified"
        ? `"${data.title}" has been verified!`
        : `"${data.title}" was sent back for revision${notes ? `: ${notes}` : ""}`,
      status === "verified" ? "task_verified" : "task_rejected",
      taskId
    )
  }

  return { data: data as TaskRow, error: null }
}

// ==================== COMMENTS ====================

export async function getTaskComments(taskId: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("task_comments")
    .select("*, profiles(first_name, last_name, email)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as CommentRow[], error: null }
}

export async function addTaskComment(taskId: string, content: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: user.id,
      content,
      is_system: false,
    })
    .select("*, profiles(first_name, last_name, email)")
    .single()

  if (error) return { data: null, error: error.message }

  // Get task to notify other party
  const { data: task } = await supabase.from("tasks").select("title, assigned_to, created_by").eq("id", taskId).single()
  if (task) {
    const notifyUser = task.assigned_to === user.id ? task.created_by : task.assigned_to
    if (notifyUser && notifyUser !== user.id) {
      await createNotification(
        supabase,
        notifyUser,
        "New Comment",
        `New comment on "${task.title}"`,
        "task_comment",
        taskId
      )
    }
  }

  return { data: data as CommentRow, error: null }
}

export async function deleteTaskComment(commentId: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { error: authError }

  const { error } = await supabase.from("task_comments").delete().eq("id", commentId)
  if (error) return { error: error.message }
  return { error: null }
}

// ==================== ATTACHMENTS ====================

export async function getTaskAttachments(taskId: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as AttachmentRow[], error: null }
}

export async function addTaskAttachment(taskId: string, params: {
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
}) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      user_id: user.id,
      file_name: params.file_name,
      file_url: params.file_url,
      file_size: params.file_size || null,
      file_type: params.file_type || null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // System comment
  await supabase.from("task_comments").insert({
    task_id: taskId,
    user_id: user.id,
    content: `Attached file: ${params.file_name}`,
    is_system: true,
  })

  return { data: data as AttachmentRow, error: null }
}

export async function deleteTaskAttachment(attachmentId: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { error: authError }

  const { error } = await supabase.from("task_attachments").delete().eq("id", attachmentId)
  if (error) return { error: error.message }
  return { error: null }
}

// ==================== NOTIFICATIONS ====================

export async function getMyNotifications(limit = 20) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError, unreadCount: 0 }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message, unreadCount: 0 }

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return { data: data as NotificationRow[], error: null, unreadCount: count || 0 }
}

export async function markNotificationRead(notificationId: string) {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { error: authError }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function markAllNotificationsRead() {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { error: authError }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { error: error.message }
  return { error: null }
}

// ==================== ADMIN HELPERS ====================

export async function getApprovedEmployees() {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, department, role")
    .eq("status", "approved")
    .order("first_name", { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getTaskStats() {
  const { supabase, user, error: authError } = await getAuthUser()
  if (!user) return { data: null, error: authError }

  const { data, error } = await supabase
    .from("tasks")
    .select("status, priority, verification_status")
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)

  if (error) return { data: null, error: error.message }

  const stats = {
    total: data.length,
    not_started: data.filter(t => t.status === "not_started").length,
    in_progress: data.filter(t => t.status === "in_progress").length,
    under_review: data.filter(t => t.status === "under_review").length,
    completed: data.filter(t => t.status === "completed").length,
    verified: data.filter(t => t.verification_status === "verified").length,
    high_priority: data.filter(t => t.priority === "high" || t.priority === "urgent").length,
  }

  return { data: stats, error: null }
}
