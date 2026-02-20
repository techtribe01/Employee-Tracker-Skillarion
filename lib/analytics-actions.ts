'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

type AnalyticsMetric = {
  taskCompletionRate: number
  avgCompletionDays: number
  qualityScore: number
  productivityTrend: 'up' | 'down' | 'stable'
  totalTasksAssigned: number
  totalTasksCompleted: number
  totalTasksInProgress: number
  totalTasksVerified: number
  avgQualityScore: number
}

type AttendanceMetric = {
  totalDays: number
  presentDays: number
  absentDays: number
  onTimeDays: number
  lateDays: number
  punctualityRate: number
  attendanceRate: number
  avgBreakTime: number
  overtimeHours: number
  leavesTaken: number
}

export async function getTaskMetrics(
  userId?: string,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<{ data: AnalyticsMetric | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const query = supabase
      .from('tasks')
      .select(
        `
        id,
        status,
        verification_status,
        completed_at,
        started_at,
        estimated_hours,
        actual_hours
      `,
        { count: 'exact' }
      )
      .gte('created_at', startDate.toISOString())

    if (userId) {
      query.eq('assigned_to', userId)
    }

    const { data: tasks, count } = await query

    if (!tasks) return { data: null, error: null }

    const completed = tasks.filter((t) => t.status === 'completed').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const verified = tasks.filter((t) => t.verification_status === 'verified').length

    const completedWithDates = tasks.filter((t) => t.completed_at && t.started_at)
    const avgCompletionDays =
      completedWithDates.length > 0
        ? completedWithDates.reduce((sum, t) => {
            const days = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0) / completedWithDates.length
        : 0

    const qualityScore = verified > 0 ? Math.round((verified / completed) * 100) : 0

    const completionRate = count ? Math.round((completed / count) * 100) : 0

    return {
      data: {
        taskCompletionRate: completionRate,
        avgCompletionDays: Math.round(avgCompletionDays * 10) / 10,
        qualityScore,
        productivityTrend: completed > inProgress ? 'up' : inProgress > completed ? 'down' : 'stable',
        totalTasksAssigned: count || 0,
        totalTasksCompleted: completed,
        totalTasksInProgress: inProgress,
        totalTasksVerified: verified,
        avgQualityScore: qualityScore,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getAttendanceMetrics(
  userId?: string,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<{ data: AttendanceMetric | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const query = supabase
      .from('attendance_records')
      .select('*', { count: 'exact' })
      .gte('clock_in', startDate.toISOString())

    if (userId) {
      query.eq('user_id', userId)
    }

    const { data: records, count } = await query

    if (!records) return { data: null, error: null }

    const onTime = records.filter((r) => {
      const clockIn = new Date(r.clock_in)
      return clockIn.getHours() <= 9 || (clockIn.getHours() === 9 && clockIn.getMinutes() <= 30)
    }).length

    const totalBreaks = records.reduce((sum, r) => sum + (r.total_break_minutes || 0), 0)
    const avgBreakTime = records.length > 0 ? totalBreaks / records.length : 0

    const overTimeRecords = records.filter((r) => {
      if (!r.total_hours) return false
      return r.total_hours > 9
    })
    const totalOvertime = overTimeRecords.reduce((sum, r) => sum + (r.total_hours ? r.total_hours - 9 : 0), 0)

    const leaves = supabase.from('leave_requests').select('*', { count: 'exact' }).eq('status', 'approved')

    if (userId) {
      leaves.eq('user_id', userId)
    }

    const { count: leaveCount } = await leaves

    return {
      data: {
        totalDays: count || 0,
        presentDays: count || 0,
        absentDays: 0,
        onTimeDays: onTime,
        lateDays: (count || 0) - onTime,
        punctualityRate: count ? Math.round((onTime / count) * 100) : 0,
        attendanceRate: count ? Math.round(((count - 0) / count) * 100) : 0,
        avgBreakTime: Math.round(avgBreakTime * 10) / 10,
        overtimeHours: Math.round(totalOvertime * 10) / 10,
        leavesTaken: leaveCount || 0,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getTeamProductivityMetrics(): Promise<{
  data: { userId: string; name: string; taskRate: number; qualityScore: number }[] | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, role').eq('role', 'employee')

    if (!profiles) return { data: null, error: null }

    const metrics = await Promise.all(
      profiles.map(async (profile) => {
        const result = await getTaskMetrics(profile.id, 'month')
        return {
          userId: profile.id,
          name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown',
          taskRate: result.data?.taskCompletionRate || 0,
          qualityScore: result.data?.qualityScore || 0,
        }
      })
    )

    return { data: metrics, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getCachedMetric(cacheKey: string): Promise<{ data: any | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('analytics_cache').select('data').eq('cache_key', cacheKey).single()

    return { data: data?.data || null, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function cacheMetric(cacheKey: string, metricType: string, data: any, ttlHours: number = 1): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + ttlHours)

    await supabase.from('analytics_cache').upsert({
      cache_key: cacheKey,
      metric_type: metricType,
      data,
      expires_at: expiresAt.toISOString(),
    })

    revalidateTag('analytics')
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}
