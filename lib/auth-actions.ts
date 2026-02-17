'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: {
  email: string
  password: string
  firstName: string
  lastName: string
  department: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        department: formData.department,
        role: 'employee',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Update the profile with department info (trigger creates the row)
  if (data.user) {
    // The trigger will have created the profile, now update with department
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ department: formData.department })
      .eq('id', data.user.id)

    if (profileError) {
      // Non-critical: department will be set later
      console.error('Profile update error:', profileError)
    }
  }

  return { success: true, needsEmailVerification: true }
}

export async function signUpAdmin(formData: {
  email: string
  password: string
  firstName: string
  lastName: string
  adminCode: string
}) {
  const supabase = await createClient()

  // Verify admin code (should be stored securely in environment or database)
  const validAdminCodes = (process.env.ADMIN_REGISTRATION_CODES || '')
    .split(',')
    .map(code => code.trim())
    .filter(code => code.length > 0)
  
  console.log("[v0] Admin code validation - provided:", formData.adminCode.trim(), "valid codes:", validAdminCodes)
  
  if (!validAdminCodes.includes(formData.adminCode.trim())) {
    console.log("[v0] Admin code rejected")
    return { error: 'Invalid admin registration code' }
  }

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'admin',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Create admin profile with approved status (no 2FA required)
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        status: 'approved',
        role: 'admin',
        requires_2fa: false,
      })
      .eq('id', data.user.id)

    if (profileError) {
      console.error('Admin profile update error:', profileError)
      return { error: 'Failed to set up admin account' }
    }
  }

  return { success: true, needsEmailVerification: false }
}

export async function signIn(formData: {
  email: string
  password: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check if user is approved
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', data.user.id)
      .single()

    if (profile?.status === 'pending_approval') {
      redirect('/pending-approval')
    }
    if (profile?.status === 'rejected') {
      return { error: 'Your account has been rejected. Please contact admin.' }
    }
    
    // User is approved, redirect to dashboard
    redirect('/dashboard')
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(email: string) {
  const supabase = await createClient()

  // Get the correct redirect URL - try multiple env vars for compatibility
  const baseUrl = 
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
    'http://localhost:3000'

  const redirectUrl = `${baseUrl}/auth/callback?next=/reset-password`

  console.log("[v0] Requesting password reset for:", email)
  console.log("[v0] Redirect URL:", redirectUrl)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) {
    console.error("[v0] Password reset error:", error)
    return { error: error.message || 'Failed to send password reset email. Please try again.' }
  }

  console.log("[v0] Password reset email sent to:", email)
  return { success: true }
}

export async function resendVerificationEmail(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function checkApprovalStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'unauthenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  return { status: profile?.status || 'pending_approval' }
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { profile, user }
}

// Admin actions
export async function getPendingUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { profiles }
}

export async function approveUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function rejectUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'rejected' })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateProfile(data: {
  firstName?: string
  lastName?: string
  phone?: string
  department?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      department: data.department,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
