'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Search, TrendingUp, Filter, ChevronRight, Award, Zap, Target } from 'lucide-react'
import { getTeamProductivityMetrics, getTaskMetrics } from '@/lib/analytics-actions'
import { useToast } from '@/hooks/use-toast'

export default function ProductivityMetricsPage() {
  const { toast } = useToast()
  const [teamMetrics, setTeamMetrics] = useState<any[]>([])
  const [filteredMetrics, setFilteredMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true)
      try {
        const res = await getTeamProductivityMetrics()
        if (res.data) {
          const sorted = [...res.data].sort((a, b) => b.taskRate - a.taskRate)
          setTeamMetrics(sorted)
          setFilteredMetrics(sorted)
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load productivity metrics',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [toast])

  useEffect(() => {
    if (searchTerm) {
      setFilteredMetrics(teamMetrics.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase())))
    } else {
      setFilteredMetrics(teamMetrics)
    }
  }, [searchTerm, teamMetrics])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading productivity metrics...</p>
        </div>
      </div>
    )
  }

  const topPerformer = filteredMetrics[0]
  const avgTaskRate = filteredMetrics.length > 0 ? Math.round(filteredMetrics.reduce((sum, m) => sum + m.taskRate, 0) / filteredMetrics.length) : 0
  const avgQuality = filteredMetrics.length > 0 ? Math.round(filteredMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / filteredMetrics.length) : 0

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Productivity Metrics</h1>
          <p className="text-sm text-muted-foreground">Team performance and task completion analysis</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                <Award className="h-4 w-4" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{topPerformer?.name || 'N/A'}</p>
              <p className="text-xs text-muted-foreground mt-1">{topPerformer?.taskRate || 0}% completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                <Zap className="h-4 w-4" />
                Avg Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{avgTaskRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Across {filteredMetrics.length} members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                <Target className="h-4 w-4" />
                Avg Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{avgQuality}%</p>
              <p className="text-xs text-muted-foreground mt-1">Verified tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Completion Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Task Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredMetrics.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="taskRate" fill="#3b82f6" name="Completion Rate %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quality vs Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quality vs Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={filteredMetrics} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="taskRate" name="Completion Rate" />
                  <YAxis dataKey="qualityScore" name="Quality Score" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Team Members" data={filteredMetrics} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team Ranking */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Team Ranking</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs w-48"
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredMetrics.map((metric, idx) => (
                <div key={metric.userId} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{metric.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {metric.taskRate}% completion • {metric.qualityScore}% quality
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={metric.taskRate >= avgTaskRate ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {metric.taskRate}%
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
