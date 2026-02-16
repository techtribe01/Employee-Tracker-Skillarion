import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/setup
 * Creates Manoj as an admin user for initial setup
 * This should only be accessible when no admins exist yet
 */

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if any admins already exist (security check)
    const { count: adminCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')

    if ((adminCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists. This endpoint can only be used for initial setup.' },
        { status: 403 }
      )
    }

    const adminEmail = 'manoj@skillariondevelopement.in'
    const tempPassword = Math.random().toString(36).slice(-16) + 'Aa1!'

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Manoj',
        last_name: 'Kumar',
        role: 'admin',
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError?.message}` },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      first_name: 'Manoj',
      last_name: 'Kumar',
      email: adminEmail,
      role: 'admin',
      status: 'approved',
      department: 'Management',
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Admin user created successfully',
        email: adminEmail,
        tempPassword: tempPassword,
        userId: userId,
        instructions: 'Admin user should log in and change their password immediately.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
