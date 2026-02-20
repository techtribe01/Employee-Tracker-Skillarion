'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

type ReportTemplate = {
  id: string
  name: string
  report_type: string
  config: any
  created_by: string
}

type ReportData = {
  title: string
  generatedAt: string
  period: string
  metrics: any
  charts: any[]
}

export async function getReportTemplates(reportType?: string): Promise<{
  data: ReportTemplate[] | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    let query = supabase.from('report_templates').select('*')

    if (reportType) {
      query = query.eq('report_type', reportType)
    }

    const { data, error } = await query

    return { data: data || null, error }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function createReportTemplate(
  name: string,
  reportType: string,
  config: any,
  options?: { isPublic?: boolean; recipients?: string[] }
): Promise<{ data: ReportTemplate | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.id) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('report_templates')
      .insert({
        name,
        report_type: reportType,
        created_by: user.user.id,
        config,
        is_public: options?.isPublic || false,
        recipients: options?.recipients || [],
      })
      .select()
      .single()

    revalidateTag('reports')
    return { data, error }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateReportTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('report_templates').update(updates).eq('id', templateId)

    revalidateTag('reports')
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteReportTemplate(templateId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('report_templates').delete().eq('id', templateId)

    revalidateTag('reports')
    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function generateReport(
  templateId: string,
  period: { start: Date; end: Date } = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
): Promise<{ data: ReportData | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { data: template, error: templateError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) throw new Error('Template not found')

    const startDate = period.start.toISOString()
    const endDate = period.end.toISOString()

    let metrics: any = {}

    if (template.report_type === 'productivity') {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      const completed = tasks?.filter((t) => t.status === 'completed').length || 0
      const total = tasks?.length || 1

      metrics = {
        completionRate: Math.round((completed / total) * 100),
        totalTasks: total,
        completedTasks: completed,
      }
    } else if (template.report_type === 'attendance') {
      const { data: records } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('clock_in', startDate)
        .lte('clock_in', endDate)

      const onTime = records?.filter((r) => {
        const clockIn = new Date(r.clock_in)
        return clockIn.getHours() <= 9
      }).length || 0

      metrics = {
        recordsCount: records?.length || 0,
        onTimeCount: onTime,
        punctualityRate: records && records.length > 0 ? Math.round((onTime / records.length) * 100) : 0,
      }
    }

    const reportData: ReportData = {
      title: template.name,
      generatedAt: new Date().toISOString(),
      period: `${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`,
      metrics,
      charts: [],
    }

    return { data: reportData, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function exportReportToPDF(reportData: ReportData): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(reportData.title, 20, 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 20, 30)
    doc.text(`Period: ${reportData.period}`, 20, 40)

    let yPosition = 60
    Object.entries(reportData.metrics).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 20, yPosition)
      yPosition += 10
    })

    const pdfDataUrl = doc.output('dataurlstring')
    return { url: pdfDataUrl, error: null }
  } catch (error) {
    return { url: null, error: error as Error }
  }
}

export async function exportReportToCSV(reportData: ReportData): Promise<{ csv: string | null; error: Error | null }> {
  try {
    const headers = ['Metric', 'Value']
    const rows = Object.entries(reportData.metrics).map(([key, value]) => [key, value.toString()])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    return { csv, error: null }
  } catch (error) {
    return { csv: null, error: error as Error }
  }
}
