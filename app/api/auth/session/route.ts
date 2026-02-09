import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('rok_session')

  if (!session) {
    return NextResponse.json({ user: null })
  }

  try {
    const user = JSON.parse(session.value)
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null })
  }
}
