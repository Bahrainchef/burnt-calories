'use client'
import { useEffect, useState } from 'react'

const photoCache = {}
const pending    = {}

async function fetchPhoto(name) {
  if (name in photoCache) return photoCache[name]
  if (name in pending)    return pending[name]

  const q   = name + ' food ingredient'
  const url = `/api/pexels?q=${encodeURIComponent(q)}`

  // ── diagnostic logs — remove once photos confirmed working ──
  console.log('[Pexels] fetching via proxy:', url)

  const promise = (async () => {
    try {
      const res = await fetch(url)
      console.log('[Pexels] proxy status:', res.status, 'for', name)

      if (!res.ok) throw new Error('proxy HTTP ' + res.status)

      const data = await res.json()
      console.log('[Pexels] result for', name, ':', data.url ? '✓ got photo' : `✗ ${data.error || 'no photo'}`)

      photoCache[name] = data.url ?? null
    } catch (e) {
      console.error('[Pexels] error for', name, ':', e.message)
      photoCache[name] = null
    }

    delete pending[name]
    return photoCache[name]
  })()

  pending[name] = promise
  return promise
}

// Returns: undefined = loading | null = no photo | string = photo URL
export function useIngredientPhoto(name) {
  const [url, setUrl] = useState(() => (name && name in photoCache ? photoCache[name] : undefined))

  useEffect(() => {
    if (!name) return
    if (name in photoCache) { setUrl(photoCache[name]); return }
    fetchPhoto(name).then(u => setUrl(u))
  }, [name])

  return url
}
