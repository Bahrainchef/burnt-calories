'use client'
import { useEffect, useState } from 'react'

const photoCache = {}
const pending    = {}

// British/regional name → Spoonacular-recognized name
const NAME_MAP = {
  'Prawns':                 'shrimp',
  'Courgette':              'zucchini',
  'Aubergine':              'eggplant',
  'Coriander':              'cilantro',
  'Beef Mince':             'ground beef',
  'Chicken Mince':          'ground chicken',
  'Ginger (fresh)':         'ginger',
  'Oregano (fresh)':        'oregano',
  'Cumin Seeds (whole)':    'cumin',
  'Coriander (ground)':     'coriander',
  'Coriander Seeds (whole)':'coriander',
  'Paprika (smoked)':       'smoked paprika',
  'Cloves (ground)':        'cloves',
  'Cloves (whole)':         'cloves',
  'Ribeye Steak':           'ribeye',
  'Rump Steak':             'beef',
  'Sirloin Steak':          'sirloin',
  "Za'atar":                'zaatar',
  'Annatto Powder (achiote)':'annatto',
  'Asafoetida (hing)':      'asafoetida',
  'Black Mustard Seeds':    'mustard seeds',
}

function resolveQuery(name) {
  return NAME_MAP[name] || name
}

async function fetchPhoto(name) {
  if (name in photoCache) return photoCache[name]
  if (name in pending)    return pending[name]

  const q = resolveQuery(name)
  const promise = (async () => {
    try {
      const res  = await fetch(`/api/spoonacular?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      photoCache[name] = data.url ?? null
    } catch {
      photoCache[name] = null
    }
    delete pending[name]
    return photoCache[name]
  })()

  pending[name] = promise
  return promise
}

// Returns: undefined = loading | null = no photo (show emoji fallback) | string = photo URL
export function useIngredientPhoto(name) {
  const [url, setUrl] = useState(() => (name && name in photoCache ? photoCache[name] : undefined))

  useEffect(() => {
    if (!name) return
    if (name in photoCache) { setUrl(photoCache[name]); return }
    fetchPhoto(name).then(u => setUrl(u))
  }, [name])

  return url
}
