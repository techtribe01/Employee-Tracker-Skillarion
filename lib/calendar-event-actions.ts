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
  daysToSchedule?: number  // NEW: Schedule for 1-3 consecutive days
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

  const daysToSchedule = Math.min(formData.daysToSchedule || 1, 3)
  const createdEvents = []
  
  console.log('[v0] Creating event(s) for', daysToSchedule, 'day(s)')

  // Create events for each day
  for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
    const startDate = new Date(formData.startTime)
    startDate.setDate(startDate.getDate() + dayOffset)
    
    const endDate = new Date(formData.endTime)
    endDate.setDate(endDate.getDate() + dayOffset)
    
    const eventTitle = daysToSchedule > 1 
      ? `${formData.title} (Day ${dayOffset + 1}/${daysToSchedule})`
      : formData.title

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        title: eventTitle,
        description: formData.description,
        location: formData.location,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
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
      console.error('[v0] Event creation error for day', dayOffset + 1, ':', eventError)
      return { error: `Error creating event for day ${dayOffset + 1}: ${eventError.message}` }
    }

    console.log('[v0] Event created:', event.id)
    createdEvents.push(event)

    // Add attendees if visibility is shared
    if (formData.visibility === 'shared' && formData.attendeeEmails && formData.attendeeEmails.length > 0) {
      // Get user IDs for attendee emails
      const { data: attendees } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', formData.attendeeEmails)

      if (attendees && attendees.length > 0) {
        const attendeeRecords = attendees.map(attendee => ({
          event_id: event.id,
          user_id: attendee.id,
          email: attendee.email,
          status: 'pending',
        }))

        const { error: attendeeError } = await supabase
          .from('calendar_event_attendees')
          .insert(attendeeRecords)
        
        if (attendeeError && !attendeeError.message.includes('duplicate')) {
          console.error('[v0] Attendee error:', attendeeError)
        }
      }
    }
  }

  console.log('[v0] Created', createdEvents.length, 'event(s)')
  return { success: true, events: createdEvents }
}

export async function getCalendarEvents(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Normalize dates - convert to ISO format at start of day and end of day
  const startISO = new Date(startDate).toISOString()
  const endISO = new Date(endDate).toISOString()
  
  console.log('[v0] Fetching events for date range:', { startISO, endISO })

  // Get visible events using proper date range comparison
  const { data, error } = await supabase
    .from('calendar_events')
    .select(`
      id, title, description, location, 
      start_time, end_time, visibility, event_color,
      is_all_day, recurrence_rule, reminder_minutes,
      created_by, department,
      calendar_event_attendees(id, user_id, email, status),
      calendar_event_permissions(id, user_id, permission_type)
    `)
    .gte('end_time', startISO)
    .lte('start_time', endISO)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[v0] Get events error:', error)
    return { error: error.message }
  }

  // Filter events based on visibility permissions
  const filteredEvents = data?.filter(event => {
    // Own events always visible
    if (event.created_by === user.id) return true
    
    // Public events visible to same department
    if (event.visibility === 'public') return true
    
    // Shared events - check if user is attendee
    if (event.visibility === 'shared' && event.calendar_event_attendees?.length > 0) {
      return event.calendar_event_attendees.some((a: any) => a.user_id === user.id)
    }
    
    // Permission-based access
    if (event.calendar_event_permissions?.length > 0) {
      return event.calendar_event_permissions.some((p: any) => p.user_id === user.id)
    }
    
    return false
  }) || []

  console.log('[v0] Fetched events count:', filteredEvents.length)
  return { success: true, events: filteredEvents }
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
