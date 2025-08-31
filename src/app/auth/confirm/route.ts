import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: (type as 'signup' | 'recovery' | 'invite' | 'magiclink'),
      token_hash,
    })

    if (!error) {
      // Redirect to the specified page on successful confirmation
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Redirect to error page if confirmation failed
  return NextResponse.redirect(new URL('/auth/signin?error=confirmation_failed', request.url))
}
