'use client'
import { useEffect, useState } from 'react'

const photoCache = {}
const pending = {}
let _keyLogged = false

function getKey() {
  const k = process.env.NEXT_PUBLIC_PEXELS_API_KEY || ''
  if (!_keyLogged) {
    _keyLogged = true
    if (!k) {
      console.warn('[Pexels] NEXT_PUBLIC_PEXELS_API_KEY is not set — restart your dev server after fixing .env.local')
    } else {
      console.log('[Pexels] API key loaded, first 5 chars:', k.slice(0, 5), '— length:', k.length)
    }
  }
  return k
}

async function fetchPhoto(name) {
  if (name in photoCache) return photoCache[name]
  if (name in pending) return pending[name]

  const key = getKey()
  if (!key) {
    photoCache[name] = null
    return null
  }

  const promise = (async () => {
    try {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(name + ' food')}&per_page=1`
      const res = await fetch(url, { headers: { Authorization: key } })
      if (!res.ok) {
        console.warn('[Pexels] fetch failed for', name, res.status)
        throw new Error('non-ok ' + res.status)
      }
      const data = await res.json()
      photoCache[name] = data.photos?.[0]?.src?.medium ?? null
    } catch (e) {
      console.warn('[Pexels] error fetching photo for', name, e.message)
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
