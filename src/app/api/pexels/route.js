import { NextResponse } from 'next/server'

const KEY = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY || ''

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || 'food ingredient'
  const n = Math.min(parseInt(searchParams.get('n') || '1', 10), 10)

  if (!KEY) return NextResponse.json({ url: null, results: [] })

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${n}`,
      { headers: { Authorization: KEY }, cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ url: null, results: [], error: 'pexels_' + res.status })
    const data = await res.json()
    const results = (data.photos || []).map(p => p.src?.medium).filter(Boolean)
    return NextResponse.json({ url: results[0] ?? null, results })
  } catch (e) {
    return NextResponse.json({ url: null, results: [], error: e.message })
  }
}
