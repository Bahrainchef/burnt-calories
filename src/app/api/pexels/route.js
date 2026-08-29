import { NextResponse } from 'next/server'

// Server-side proxy — key never hits the browser, no CORS issues
const KEY = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY || ''

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || 'food ingredient'

  if (!KEY) return NextResponse.json({ url: null, error: 'no_key' }, { status: 200 })

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1`,
      { headers: { Authorization: KEY }, cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ url: null, error: 'pexels_' + res.status }, { status: 200 })
    const data = await res.json()
    const url  = data.photos?.[0]?.src?.medium ?? null
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ url: null, error: e.message }, { status: 200 })
  }
}
