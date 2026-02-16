'use server'

import { createClient } from '@supabase/supabase-js'

/**
 * Script to set up Manoj as an admin user
 * Run this once to create the admin account
 */

export async function setupAdminUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const adminEmail = 'manoj@skillariondevelopement.in'
  const adminPassword = 'TechTribe01'

  try {
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Manoj',
        last_name: 'Kumar',
        role: 'admin',
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError?.message)
      return { success: false, error: authError?.message }
    }

    const userId = authData.user.id
    console.log('✓ Auth user created:', userId)

    // 2. Create the profile record with admin role
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
      console.error('Error creating profile:', profileError.message)
      // Delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId)
      return { success: false, error: profileError.message }
    }

    console.log('✓ Profile created for admin user')

    return {
      success: true,
      message: 'Admin user created successfully',
      email: adminEmail,
      userId: userId,
      tempPassword: adminPassword,
      note: 'User should change password on first login',
    }
  } catch (error) {
    console.error('Setup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Alternative: Direct SQL approach (if the user already exists in auth.users)
 */
export async function promoteUserToAdmin(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Update existing profile to admin
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'User promoted to admin' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
