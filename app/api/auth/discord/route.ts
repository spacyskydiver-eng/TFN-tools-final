import { NextRequest, NextResponse } from 'next/server'

function getBaseUrl(request: NextRequest): string {
  // 1. Explicit env var always wins
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  // 2. Derive from the incoming request so it works on any Vercel preview URL
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  // 3. VERCEL_URL fallback (no protocol)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Discord not configured' }, { status: 500 })
  }

  const baseUrl = getBaseUrl(request)
  const redirectUri = `${baseUrl}/api/auth/discord/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
  })

  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`)
}
