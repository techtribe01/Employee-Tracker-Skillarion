'use server'

import { createClient } from '@/lib/supabase/server'

export async function createEvent(formData: {
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  isAllDay: boolean
  visibility: 'private' | 'public' | 'shared'
  eventColor: string
  reminderMinutes?: number
  recurrenceRule?: string
  attendeeEmails?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user profile for department
  const { data: profile } = await supabase
    .from('profiles')
    .select('department')
    .eq('id', user.id)
    .single()

  // Create event
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .insert({
      title: formData.title,
      description: formData.description,
      location: formData.location,
      start_time: formData.startTime,
      end_time: formData.endTime,
      is_all_day: formData.isAllDay,
      visibility: formData.visibility,
      event_color: formData.eventColor,
      reminder_minutes: formData.reminderMinutes || 15,
      recurrence_rule: formData.recurrenceRule,
      created_by: user.id,
      department: profile?.department,
    })
    .select()
    .single()

  if (eventError) {
    console.error('[v0] Event creation error:', eventError)
    return { error: eventError.message }
  }

  // Add attendees if visibility is shared
  if (formData.visibility === 'shared' && formData.attendeeEmails && formData.attendeeEmails.length > 0) {
    // Get user IDs for attendee emails
    const { data: attendees } = await supabase
      .from('profiles')
      .select('id, email: id')
      .in('email', formData.attendeeEmails)

    if (attendees && attendees.length > 0) {
      const attendeeRecords = attendees.map(attendee => ({
        event_id: event.id,
        user_id: attendee.id,
        email: formData.attendeeEmails.find(e => e.includes(attendee.email)) || '',
        status: 'pending',
      }))

      await supabase
        .from('calendar_event_attendees')
        .insert(attendeeRecords)
    }
  }

  return { success: true, event }
}

export async function getCalendarEvents(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Use the helper function to get visible events
  const { data, error } = await supabase.rpc('get_visible_events', {
    user_id: user.id,
    start_date: startDate,
    end_date: endDate,
  })

  if (error) {
    console.error('[v0] Get events error:', error)
    return { error: error.message }
  }

  return { success: true, events: data }
}

export async function updateEventVisibility(
  eventId: string,
  visibility: 'private' | 'public' | 'shared'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('calendar_events')
    .update({ visibility })
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function addEventAttendees(
  eventId: string,
  attendeeEmails: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns the event
  const { data: event } = await supabase
    .from('calendar_events')
    .select('id')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .single()

  if (!event) {
    return { error: 'Unauthorized' }
  }

  // Get user IDs for attendee emails
  const { data: attendees } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', attendeeEmails)

  if (!attendees || attendees.length === 0) {
    return { error: 'No matching users found' }
  }

  const attendeeRecords = attendees.map(attendee => ({
    event_id: eventId,
    user_id: attendee.id,
    email: attendee.email,
    status: 'pending',
  }))

  const { error } = await supabase
    .from('calendar_event_attendees')
    .insert(attendeeRecords)

  if (error && !error.message.includes('duplicate')) {
    return { error: error.message }
  }

  return { success: true }
}

export async function respondToInvite(
  eventId: string,
  status: 'accepted' | 'declined' | 'tentative'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('calendar_event_attendees')
    .update({
      status,
      response_date: new Date().toISOString(),
    })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getEventDetails(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError) {
    return { error: eventError.message }
  }

  // Get attendees if shared event
  let attendees = []
  if (event.visibility === 'shared') {
    const { data: attendeeData } = await supabase
      .from('calendar_event_attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    attendees = attendeeData || []
  }

  return { success: true, event: { ...event, attendees } }
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
