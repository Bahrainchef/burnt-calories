'use client'
import { useEffect, useState } from 'react'

const photoCache    = {}
const pending       = {}
const REQUEST_QUEUE = []
let   queueRunning  = false

const QUERY_OVERRIDES = {
  'Avocado':              'avocado fresh cut halved',
  'Couscous':             'couscous dry uncooked bowl',
  'Raspberries':          'raspberries fresh isolated',
  'Strawberries':         'strawberries fresh isolated',
  'Ribeye Steak':         'ribeye steak raw uncooked',
  'Snapper':              'red snapper fish raw',
  'Prawns':               'prawns raw uncooked fresh',
  'Rump Steak':           'rump steak raw beef',
  'Sirloin Steak':        'sirloin steak raw uncooked',
  'Cumin':                'cumin seeds spice',
  'Cumin Seeds (whole)':  'cumin seeds whole spice',
  'Paprika':              'paprika powder spice red',
  'Paprika (smoked)':     'smoked paprika powder red spice',
  'Turmeric':             'turmeric powder yellow spice',
  'Oregano':              'oregano dried herb',
  'Oregano (fresh)':      'fresh oregano herb leaves',
  'Cinnamon':             'cinnamon sticks spice',
  'Ginger':               'fresh ginger root',
  'Ginger (fresh)':       'fresh ginger root',
  'Garlic':               'fresh garlic cloves',
  'Chilli':               'red chilli pepper fresh',
  'Balsamic Vinegar':     'balsamic vinegar bottle',
  'Apple Cider Vinegar':  'apple cider vinegar bottle',
  'Olive Oil':            'olive oil bottle',
  'Soy Sauce':            'soy sauce bottle dark',
  'Coconut Milk':         'coconut milk can tin',
  'Harissa Paste':        'harissa paste jar red',
  'Baharat':              'baharat spice mix powder',
  'Ras El Hanout':        'ras el hanout spice blend',
  'Garam Masala':         'garam masala spice powder',
  'Curry Powder':         'curry powder spice yellow',
  'Za\'atar':             'zaatar herb spice mix',
  'Sumac':                'sumac spice powder red',
  'Saffron':              'saffron threads spice',
  'Cardamom':             'cardamom pods green spice',
  'Coriander (ground)':   'coriander powder ground spice',
  'Black Pepper':         'black pepper whole spice',
  'Chilli Powder':        'chilli powder spice red',
}

function buildQuery(name, cat, sub) {
  if (QUERY_OVERRIDES[name]) return QUERY_OVERRIDES[name]
  if (cat === 'Protein')                                            return `${name} raw uncooked`
  if (cat === 'Spice' || (cat === 'Other' && sub === 'Spices'))    return `${name} spice powder`
  if (cat === 'Herb')                                              return `${name} fresh herb`
  if (cat === 'Vegetable' && (sub === 'Herbs' || sub === 'Aromatics')) return `${name} fresh herb`
  if (cat === 'Vegetable')                                         return `${name} fresh isolated`
  if (cat === 'Fruit')                                             return `${name} fresh isolated`
  if (cat === 'Fat' && sub === 'Oils')                             return `${name} bottle`
  if (cat === 'Other' && (sub === 'Condiments' || sub === 'Sauces')) return `${name} bottle`
  if (cat === 'Carbohydrate')                                      return `${name} dry uncooked`
  return `${name} raw ingredient isolated white background`
}

async function drainQueue() {
  if (queueRunning) return
  queueRunning = true
  while (REQUEST_QUEUE.length) {
    const batch = REQUEST_QUEUE.splice(0, 10)
    await Promise.all(batch.map(fn => fn()))
    if (REQUEST_QUEUE.length) await new Promise(r => setTimeout(r, 100))
  }
  queueRunning = false
}

async function fetchPhoto(name, cat, sub) {
  if (name in photoCache) return photoCache[name]
  if (name in pending)    return pending[name]

  const promise = new Promise(resolve => {
    REQUEST_QUEUE.push(async () => {
      const q = buildQuery(name, cat, sub)
      try {
        const res  = await fetch(`/api/pexels?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        photoCache[name] = data.url ?? null
      } catch {
        photoCache[name] = null
      }
      delete pending[name]
      resolve(photoCache[name])
    })
    drainQueue()
  })

  pending[name] = promise
  return promise
}

// Returns: undefined = loading | null = no photo | string = photo URL
export function useIngredientPhoto(name, cat, sub) {
  const [url, setUrl] = useState(() => (name && name in photoCache ? photoCache[name] : undefined))

  useEffect(() => {
    if (!name) return
    if (name in photoCache) { setUrl(photoCache[name]); return }
    fetchPhoto(name, cat, sub).then(u => setUrl(u))
  }, [name, cat, sub])

  return url
}
