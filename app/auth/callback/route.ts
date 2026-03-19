import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_DOMAINS = ['motiv-i.com', 'madcorp.co.kr']
const ALLOWED_EMAILS = ['vibeyangjm@gmail.com']

function isAllowedEmail(email: string): boolean {
  if (ALLOWED_EMAILS.includes(email)) return true
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email && !isAllowedEmail(user.email)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/unauthorized`)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
