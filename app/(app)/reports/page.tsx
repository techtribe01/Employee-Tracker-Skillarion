'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Download, Plus, Edit2, Trash2, Clock, Calendar, Settings, Play } from 'lucide-react'
import { generateReport, getReportTemplates, createReportTemplate, exportReportToPDF, exportReportToCSV } from '@/lib/report-actions'
import { useToast } from '@/hooks/use-toast'

interface ReportTemplate {
  id: string
  name: string
  report_type: string
  description?: string
  is_default: boolean
  export_formats: string[]
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    reportType: 'productivity',
    description: '',
  })
  const [scheduleSettings, setScheduleSettings] = useState({
    frequency: 'weekly',
    day: 'Monday',
    format: 'pdf',
  })

  const reportTypes = [
    { value: 'productivity', label: 'Productivity Report', desc: 'Task completion, quality scores, team performance' },
    { value: 'attendance', label: 'Attendance Report', desc: 'Attendance rates, punctuality, leave usage' },
    { value: 'summary', label: 'Executive Summary', desc: 'High-level metrics across all areas' },
  ]

  const handleGenerateReport = async (templateId: string) => {
    setGenerating(true)
    try {
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 30)

      const result = await generateReport(templateId, {
        start: startDate,
        end: today,
      })

      if (result.data) {
        toast({
          title: 'Report Generated',
          description: 'The report has been generated successfully',
        })
      } else {
        throw new Error(result.error?.message || 'Failed to generate report')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const pdfResult = await exportReportToPDF({
        title: 'Employee Tracking Report',
        generatedAt: new Date().toISOString(),
        period: 'Last 30 Days',
        metrics: {
          completionRate: 85,
          qualityScore: 92,
          attendanceRate: 96,
          punctualityRate: 94,
        },
        charts: [],
      })

      if (pdfResult.url) {
        const link = document.createElement('a')
        link.href = pdfResult.url
        link.download = `report-${Date.now()}.pdf`
        link.click()
        toast({
          title: 'Downloaded',
          description: 'Report exported as PDF',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      })
    }
  }

  const handleExportCSV = async () => {
    try {
      const csvResult = await exportReportToCSV({
        title: 'Employee Tracking Report',
        generatedAt: new Date().toISOString(),
        period: 'Last 30 Days',
        metrics: {
          completionRate: 85,
          qualityScore: 92,
          attendanceRate: 96,
          punctualityRate: 94,
        },
        charts: [],
      })

      if (csvResult.csv) {
        const link = document.createElement('a')
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvResult.csv)}`
        link.download = `report-${Date.now()}.csv`
        link.click()
        toast({
          title: 'Downloaded',
          description: 'Report exported as CSV',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export CSV',
        variant: 'destructive',
      })
    }
  }

  const defaultTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Weekly Productivity Report',
      report_type: 'productivity',
      description: 'Summary of weekly task completion and team performance',
      is_default: true,
      export_formats: ['pdf', 'csv'],
    },
    {
      id: '2',
      name: 'Monthly Attendance Report',
      report_type: 'attendance',
      description: 'Monthly attendance patterns and punctuality metrics',
      is_default: true,
      export_formats: ['pdf', 'excel'],
    },
    {
      id: '3',
      name: 'Executive Summary',
      report_type: 'summary',
      description: 'High-level overview of all key metrics',
      is_default: true,
      export_formats: ['pdf'],
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports & Export</h1>
            <p className="text-sm text-muted-foreground">Generate and schedule automated reports</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Report Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Report Name</label>
                  <Input
                    placeholder="e.g., Monthly Summary"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Report Type</label>
                  <Select value={newTemplate.reportType} onValueChange={(v) => setNewTemplate({ ...newTemplate, reportType: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                  <Select value={scheduleSettings.frequency} onValueChange={(v) => setScheduleSettings({ ...scheduleSettings, frequency: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Export Format</label>
                  <Select value={scheduleSettings.format} onValueChange={(v) => setScheduleSettings({ ...scheduleSettings, format: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Create Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Export */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="h-4 w-4" />
              Quick Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export as PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export as CSV
              </Button>
              <Button variant="secondary" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Export as Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Default Reports */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Default Reports</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.report_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport(template.id)}
                      disabled={generating}
                      className="flex-1 gap-2"
                    >
                      <Play className="h-3 w-3" />
                      Generate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleExportPDF}
                      className="gap-2"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Scheduled Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  name: 'Weekly Team Performance',
                  schedule: 'Every Monday at 9:00 AM',
                  recipients: 'managers@company.com',
                  format: 'PDF',
                },
                {
                  name: 'Monthly Attendance',
                  schedule: 'First day of month at 8:00 AM',
                  recipients: 'hr@company.com',
                  format: 'Excel',
                },
              ].map((report, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.schedule}</p>
                    <p className="text-xs text-muted-foreground">To: {report.recipients}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {report.format}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Types Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Available Report Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportTypes.map((type) => (
                <div key={type.value} className="rounded-lg bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
