import { NextResponse } from 'next/server'

const KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || ''

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (!KEY || !q) return NextResponse.json({ url: null })

  try {
    const res = await fetch(
      `https://api.spoonacular.com/food/ingredients/search?query=${encodeURIComponent(q)}&number=1&apiKey=${KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ url: null, error: 'spoonacular_' + res.status })
    const data = await res.json()
    const img  = data.results?.[0]?.image
    const url  = img ? `https://spoonacular.com/cdn/ingredients_250x250/${img}` : null
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ url: null, error: e.message })
  }
}
