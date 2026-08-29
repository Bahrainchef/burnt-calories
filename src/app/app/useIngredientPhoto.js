'use client'
import { useEffect, useState } from 'react'

const photoCache = {}
const pending = {}

async function fetchPhoto(name) {
  if (name in photoCache) return photoCache[name]
  if (name in pending) return pending[name]

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(name + ' food ingredient')}&per_page=1`,
        { headers: { Authorization: process.env.NEXT_PUBLIC_PEXELS_API_KEY } }
      )
      if (!res.ok) throw new Error('non-ok')
      const data = await res.json()
      photoCache[name] = data.photos?.[0]?.src?.medium ?? null
    } catch {
      photoCache[name] = null
    }
    delete pending[name]
    return photoCache[name]
  })()

  pending[name] = promise
  return promise
}

// Returns: undefined = loading, null = no photo found, string = photo URL
export function useIngredientPhoto(name) {
  const [url, setUrl] = useState(() => (name && name in photoCache ? photoCache[name] : undefined))

  useEffect(() => {
    if (!name) return
    if (name in photoCache) {
      setUrl(photoCache[name])
      return
    }
    fetchPhoto(name).then(u => setUrl(u))
  }, [name])

  return url
}
