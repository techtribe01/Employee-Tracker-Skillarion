'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Eye, EyeOff, Lock, Users, Clock, MapPin, Bell } from 'lucide-react'
import { createEvent } from '@/lib/calendar-event-actions'

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreated?: () => void
  initialDate?: Date
}

const EVENT_COLORS = [
  { name: 'Blue', value: '#4285f4' },
  { name: 'Red', value: '#ea4335' },
  { name: 'Yellow', value: '#fbbc04' },
  { name: 'Green', value: '#34a853' },
  { name: 'Purple', value: '#9c27b0' },
  { name: 'Cyan', value: '#00bcd4' },
  { name: 'Orange', value: '#ff6d00' },
]

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see' },
  { value: 'public', label: 'Public', icon: Eye, description: 'Your department can see' },
  { value: 'shared', label: 'Shared', icon: Users, description: 'Invite specific people' },
]

export function CreateEventModal({
  open,
  onOpenChange,
  onEventCreated,
  initialDate,
}: CreateEventModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: initialDate ? initialDate.toISOString().slice(0, 16) : '',
    endTime: initialDate ? new Date(initialDate.getTime() + 3600000).toISOString().slice(0, 16) : '',
    isAllDay: false,
    visibility: 'private' as const,
    eventColor: '#4285f4',
    reminderMinutes: 15,
    attendeeEmails: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const attendeeEmails = formData.attendeeEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.includes('@'))

    const result = await createEvent({
      title: formData.title,
      description: formData.description || undefined,
      location: formData.location || undefined,
      startTime: formData.startTime,
      endTime: formData.endTime,
      isAllDay: formData.isAllDay,
      visibility: formData.visibility,
      eventColor: formData.eventColor,
      reminderMinutes: formData.reminderMinutes,
      attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    // Reset form
    setFormData({
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      isAllDay: false,
      visibility: 'private',
      eventColor: '#4285f4',
      reminderMinutes: 15,
      attendeeEmails: '',
    })

    onOpenChange(false)
    onEventCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Team Meeting, Project Deadline"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add event details..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Meeting room or URL"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.isAllDay}
              onChange={e => setFormData({ ...formData, isAllDay: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="allDay" className="cursor-pointer">
              All day event
            </Label>
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <Label>Visibility *</Label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map(option => {
                const Icon = option.icon
                const isSelected = formData.visibility === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: option.value as any })}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-center text-sm">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Attendees (only for shared) */}
          {formData.visibility === 'shared' && (
            <div className="space-y-2">
              <Label htmlFor="attendees">
                <Users className="inline h-4 w-4 mr-2" />
                Invite People
              </Label>
              <Textarea
                id="attendees"
                placeholder="Enter email addresses separated by commas (e.g., john@company.com, jane@company.com)"
                value={formData.attendeeEmails}
                onChange={e => setFormData({ ...formData, attendeeEmails: e.target.value })}
                rows={2}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Event Color */}
            <div className="space-y-2">
              <Label>Event Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, eventColor: color.value })}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.eventColor === color.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Reminder */}
            <div className="space-y-2">
              <Label htmlFor="reminder" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminder
              </Label>
              <Select
                value={formData.reminderMinutes.toString()}
                onValueChange={value => setFormData({ ...formData, reminderMinutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No reminder</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title}>
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
