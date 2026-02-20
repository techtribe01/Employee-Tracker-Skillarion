import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, payload, queuedAt } = body

    switch (type) {
      case "clock_in": {
        // Check if already clocked in
        const { data: active } = await supabase
          .from("attendance_records")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "clocked_in")
          .maybeSingle()

        if (active) {
          return NextResponse.json(
            { error: "Already clocked in", skipped: true },
            { status: 200 }
          )
        }

        const { error } = await supabase.from("attendance_records").insert({
          user_id: user.id,
          clock_in: queuedAt || new Date().toISOString(),
          clock_in_lat: payload.lat ?? null,
          clock_in_lng: payload.lng ?? null,
          clock_in_address: payload.address ?? null,
          status: "clocked_in",
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        break
      }

      case "clock_out": {
        const attendanceId = payload.attendanceId as string
        if (!attendanceId) {
          return NextResponse.json(
            { error: "Missing attendanceId" },
            { status: 400 }
          )
        }

        // End active breaks first
        const { data: activeBreak } = await supabase
          .from("breaks")
          .select("id, break_start")
          .eq("attendance_id", attendanceId)
          .eq("user_id", user.id)
          .is("break_end", null)
          .maybeSingle()

        if (activeBreak) {
          const breakEnd = queuedAt || new Date().toISOString()
          const durationMinutes = Math.round(
            (new Date(breakEnd).getTime() -
              new Date(activeBreak.break_start).getTime()) /
              60000
          )
          await supabase
            .from("breaks")
            .update({
              break_end: breakEnd,
              duration_minutes: durationMinutes,
            })
            .eq("id", activeBreak.id)
        }

        // Calculate total breaks
        const { data: breaks } = await supabase
          .from("breaks")
          .select("break_start, break_end")
          .eq("attendance_id", attendanceId)

        let totalBreakMinutes = 0
        if (breaks) {
          for (const b of breaks) {
            if (b.break_start && b.break_end) {
              totalBreakMinutes += Math.round(
                (new Date(b.break_end).getTime() -
                  new Date(b.break_start).getTime()) /
                  60000
              )
            }
          }
        }

        // Get clock-in time
        const { data: record } = await supabase
          .from("attendance_records")
          .select("clock_in")
          .eq("id", attendanceId)
          .single()

        const clockInTime = record?.clock_in
          ? new Date(record.clock_in).getTime()
          : Date.now()
        const clockOutTime = queuedAt
          ? new Date(queuedAt).getTime()
          : Date.now()
        const totalHours =
          Math.round(
            ((clockOutTime - clockInTime) / 3600000 -
              totalBreakMinutes / 60) *
              100
          ) / 100

        const { error } = await supabase
          .from("attendance_records")
          .update({
            clock_out: queuedAt || new Date().toISOString(),
            clock_out_lat: payload.lat ?? null,
            clock_out_lng: payload.lng ?? null,
            clock_out_address: payload.address ?? null,
            status: "clocked_out",
            total_hours: Math.max(0, totalHours),
            total_break_minutes: totalBreakMinutes,
          })
          .eq("id", attendanceId)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        break
      }

      case "start_break": {
        const { attendanceId: breakAttId, breakType } = payload as {
          attendanceId: string
          breakType?: string
        }

        // Check no active break
        const { data: existingBreak } = await supabase
          .from("breaks")
          .select("id")
          .eq("attendance_id", breakAttId)
          .eq("user_id", user.id)
          .is("break_end", null)
          .maybeSingle()

        if (existingBreak) {
          return NextResponse.json(
            { error: "Already on break", skipped: true },
            { status: 200 }
          )
        }

        const { error } = await supabase.from("breaks").insert({
          attendance_id: breakAttId,
          user_id: user.id,
          break_start: queuedAt || new Date().toISOString(),
          break_type: breakType ?? "general",
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        break
      }

      case "end_break": {
        const breakId = payload.breakId as string
        if (!breakId) {
          return NextResponse.json(
            { error: "Missing breakId" },
            { status: 400 }
          )
        }

        const { data: breakRec } = await supabase
          .from("breaks")
          .select("break_start")
          .eq("id", breakId)
          .single()

        const breakEnd = queuedAt || new Date().toISOString()
        const duration = breakRec?.break_start
          ? Math.round(
              (new Date(breakEnd).getTime() -
                new Date(breakRec.break_start).getTime()) /
                60000
            )
          : 0

        const { error } = await supabase
          .from("breaks")
          .update({
            break_end: breakEnd,
            duration_minutes: duration,
          })
          .eq("id", breakId)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown action type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
