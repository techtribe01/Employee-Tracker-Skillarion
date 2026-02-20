'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Download,
  RefreshCw,
} from 'lucide-react'
import { getTaskMetrics, getAttendanceMetrics, getTeamProductivityMetrics } from '@/lib/analytics-actions'
import { useToast } from '@/hooks/use-toast'

export default function AnalyticsDashboard() {
  const { toast } = useToast()
  const [taskMetrics, setTaskMetrics] = useState<any>(null)
  const [attendanceMetrics, setAttendanceMetrics] = useState<any>(null)
  const [teamMetrics, setTeamMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true)
      try {
        const [taskRes, attendanceRes, teamRes] = await Promise.all([
          getTaskMetrics(undefined, period),
          getAttendanceMetrics(undefined, period),
          getTeamProductivityMetrics(),
        ])

        if (taskRes.data) setTaskMetrics(taskRes.data)
        if (attendanceRes.data) setAttendanceMetrics(attendanceRes.data)
        if (teamRes.data) setTeamMetrics(teamRes.data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load analytics metrics',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [period, toast])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin">
          <RefreshCw className="h-8 w-8 text-primary" />
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Task Completion Rate',
      value: `${taskMetrics?.taskCompletionRate || 0}%`,
      change: '+5%',
      icon: CheckCircle2,
      color: 'text-success',
    },
    {
      title: 'Avg Completion Time',
      value: `${taskMetrics?.avgCompletionDays || 0} days`,
      change: '-0.5 days',
      icon: Clock,
      color: 'text-info',
    },
    {
      title: 'Quality Score',
      value: `${taskMetrics?.qualityScore || 0}%`,
      change: '+2%',
      icon: TrendingUp,
      color: 'text-warning',
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceMetrics?.attendanceRate || 0}%`,
      change: taskMetrics?.taskCompletionRate > 80 ? '+3%' : '-2%',
      icon: Users,
      color: 'text-danger',
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time metrics and performance insights</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-2">
                {period.charAt(0).toUpperCase() + period.slice(1)}
                <ChevronDown className="h-4 w-4" />
              </Button>
              <div className="absolute right-0 top-10 hidden w-32 rounded-lg border border-border bg-card p-1 shadow-lg">
                {['week', 'month', 'quarter', 'year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p as typeof period)}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted rounded"
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card, i) => {
            const Icon = card.icon
            return (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-foreground">{card.value}</span>
                    <Badge variant="outline" className="text-xs mb-1">
                      {card.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Task Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Task Completion Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { day: 'Mon', completed: 8, assigned: 10 },
                    { day: 'Tue', completed: 9, assigned: 12 },
                    { day: 'Wed', completed: 7, assigned: 11 },
                    { day: 'Thu', completed: 10, assigned: 13 },
                    { day: 'Fri', completed: 11, assigned: 12 },
                    { day: 'Sat', completed: 3, assigned: 5 },
                    { day: 'Sun', completed: 2, assigned: 4 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
                  <Line type="monotone" dataKey="assigned" stroke="#6b7280" name="Assigned" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quality Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quality Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Verified', value: taskMetrics?.totalTasksVerified || 0 },
                      { name: 'Unverified', value: (taskMetrics?.totalTasksCompleted || 0) - (taskMetrics?.totalTasksVerified || 0) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        {teamMetrics && teamMetrics.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={teamMetrics.slice(0, 8).map((m: any) => ({
                    name: m.name.split(' ')[0],
                    taskRate: m.taskRate,
                    quality: m.qualityScore,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taskRate" fill="#3b82f6" name="Completion Rate" />
                  <Bar dataKey="quality" fill="#10b981" name="Quality Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Attendance Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Attendance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Present Days</p>
                <p className="mt-1 text-lg font-bold text-foreground">{attendanceMetrics?.presentDays || 0}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">On Time</p>
                <p className="mt-1 text-lg font-bold text-foreground">{attendanceMetrics?.punctualityRate || 0}%</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Avg Break Time</p>
                <p className="mt-1 text-lg font-bold text-foreground">{attendanceMetrics?.avgBreakTime || 0} min</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Overtime Hours</p>
                <p className="mt-1 text-lg font-bold text-foreground">{attendanceMetrics?.overtimeHours || 0} hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
