'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('email not confirmed') || m.includes('email link is invalid') || m.includes('not confirmed'))
    return 'Please confirm your email first. Check your inbox (and spam folder) for the confirmation link.';
  if (m.includes('invalid login credentials') || m.includes('invalid password') || m.includes('wrong password'))
    return 'Incorrect email or password. Please try again.';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'An account with this email already exists. Try logging in instead.';
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('email rate limit exceeded'))
    return 'Too many attempts. Please wait a few minutes before trying again.';
  if (m.includes('password should be at least') || m.includes('password is too short'))
    return 'Password must be at least 6 characters long.';
  if (m.includes('unable to validate email address') || m.includes('invalid email'))
    return 'Please enter a valid email address.';
  if (m.includes('signup is disabled'))
    return 'New registrations are currently disabled. Please contact support.';
  if (m.includes('email address not authorized'))
    return 'This email domain is not authorized. Please use a different email.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Please check your connection and try again.';
  // fallback — return the original but capitalised
  return message.charAt(0).toUpperCase() + message.slice(1);
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error.message)
    redirect('/login?tab=signin&error=' + encodeURIComponent(friendlyAuthError(error.message)))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      }
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    redirect('/login?tab=signup&error=' + encodeURIComponent(friendlyAuthError(error.message)))
  }

  // Success — email confirmation sent
  redirect('/login?tab=signup&message=' + encodeURIComponent('Account created! Please check your email to confirm your account before logging in.'))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
