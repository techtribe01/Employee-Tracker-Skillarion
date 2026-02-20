'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Lock, Eye, Users, MapPin, Bell, Copy, Trash2, AlertCircle } from 'lucide-react'
import { updateEventVisibility, respondToInvite, deleteEvent, getEventDetails } from '@/lib/calendar-event-actions'
import { useToast } from '@/hooks/use-toast'

interface EventDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId?: string
  isOwner?: boolean
  onEventUpdated?: () => void
}

const VISIBILITY_ICONS = {
  private: Lock,
  public: Eye,
  shared: Users,
}

export function EventDetailsModal({
  open,
  onOpenChange,
  eventId,
  isOwner = false,
  onEventUpdated,
}: EventDetailsModalProps) {
  const { toast } = useToast()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadEvent() {
    if (!eventId) return

    setLoading(true)
    const result = await getEventDetails(eventId)

    if (result.error) {
      setError(result.error)
    } else {
      setEvent(result.event)
    }
    setLoading(false)
  }

  async function handleVisibilityChange(newVisibility: string) {
    if (!eventId) return

    const result = await updateEventVisibility(eventId, newVisibility as any)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }

    setEvent({ ...event, visibility: newVisibility })
    toast({ title: 'Updated', description: 'Event visibility changed' })
    onEventUpdated?.()
  }

  async function handleRsvp(status: 'accepted' | 'declined' | 'tentative') {
    if (!eventId) return

    const result = await respondToInvite(eventId, status)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }

    toast({ title: 'Updated', description: `You ${status} this event` })
    onEventUpdated?.()
  }

  async function handleDelete() {
    if (!eventId || !window.confirm('Are you sure you want to delete this event?')) return

    const result = await deleteEvent(eventId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }

    toast({ title: 'Deleted', description: 'Event has been deleted' })
    onOpenChange(false)
    onEventUpdated?.()
  }

  if (!open) return null

  if (!event && open) {
    loadEvent()
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!event) return null

  const VisibilityIcon = VISIBILITY_ICONS[event.visibility as keyof typeof VISIBILITY_ICONS] || Lock
  const startDate = new Date(event.start_time)
  const endDate = new Date(event.end_time)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: event.event_color }}
              />
              {event.title}
            </DialogTitle>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4">
            {/* Date & Time */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
              <p className="text-sm">
                {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                {' '}
                {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Location */}
            {event.location && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </p>
                <p className="text-sm">{event.location}</p>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Reminder */}
            {event.reminder_minutes > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" />
                Reminder {event.reminder_minutes} minutes before
              </div>
            )}

            {/* Visibility */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                <VisibilityIcon className="h-4 w-4" />
                Visibility
              </p>
              {isOwner ? (
                <Select value={event.visibility} onValueChange={handleVisibilityChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private (Only you)</SelectItem>
                    <SelectItem value="public">Public (Your department)</SelectItem>
                    <SelectItem value="shared">Shared (Invited people)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm capitalize">{event.visibility}</p>
              )}
            </div>

            {/* Attendees */}
            {event.visibility === 'shared' && event.attendees && event.attendees.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Attendees</p>
                <div className="space-y-2">
                  {event.attendees.map((attendee: any) => (
                    <div
                      key={attendee.id}
                      className="flex items-center justify-between rounded-lg bg-muted p-2"
                    >
                      <div>
                        <p className="text-sm">{attendee.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{attendee.status}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        attendee.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        attendee.status === 'declined' ? 'bg-red-100 text-red-700' :
                        attendee.status === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {attendee.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RSVP Actions */}
          {!isOwner && event.visibility === 'shared' && (
            <div className="border-t pt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRsvp('accepted')}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRsvp('tentative')}
              >
                Maybe
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRsvp('declined')}
              >
                Decline
              </Button>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
