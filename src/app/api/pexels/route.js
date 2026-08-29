import { NextResponse } from 'next/server'

// Server-side proxy — key never hits the browser, no CORS issues
const KEY = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY || ''

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || 'food ingredient'

  if (!KEY) {
    console.error('[Pexels API route] No API key found in env')
    return NextResponse.json({ url: null, error: 'no_key' }, { status: 200 })
  }

  console.log('[Pexels API route] fetching for query:', q, '| key first 8:', KEY.slice(0, 8))

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1`,
      { headers: { Authorization: KEY }, cache: 'no-store' }
    )

    console.log('[Pexels API route] status:', res.status, 'for:', q)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[Pexels API route] error body:', body.slice(0, 200))
      return NextResponse.json({ url: null, error: 'pexels_' + res.status }, { status: 200 })
    }

    const data = await res.json()
    const url  = data.photos?.[0]?.src?.medium ?? null
    return NextResponse.json({ url })
  } catch (e) {
    console.error('[Pexels API route] fetch threw:', e.message)
    return NextResponse.json({ url: null, error: e.message }, { status: 200 })
  }
}
