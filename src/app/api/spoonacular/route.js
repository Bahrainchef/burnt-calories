import { NextResponse } from 'next/server'

const KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || ''

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const n = Math.min(parseInt(searchParams.get('n') || '1', 10), 10)

  if (!KEY || !q) return NextResponse.json({ url: null, results: [] })

  try {
    const res = await fetch(
      `https://api.spoonacular.com/food/ingredients/search?query=${encodeURIComponent(q)}&number=${n}&apiKey=${KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ url: null, results: [], error: 'spoonacular_' + res.status })
    const data = await res.json()
    const results = (data.results || []).map(r =>
      r.image ? `https://spoonacular.com/cdn/ingredients_250x250/${r.image}` : null
    ).filter(Boolean)
    return NextResponse.json({ url: results[0] ?? null, results })
  } catch (e) {
    return NextResponse.json({ url: null, results: [], error: e.message })
  }
}
