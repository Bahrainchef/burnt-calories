/**
 * Bulk-seed ingredient photos from Spoonacular.
 * Skips rows that already have photo_url set (resumable).
 * Free tier: 150 req/day — run on multiple days if needed.
 *
 * Usage: node scripts/seed_ingredient_photos.mjs
 *
 * Prereq: run in Supabase SQL editor first:
 *   ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS photo_url text;
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lglubafgeurmqjuwmerw.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbHViYWZnZXVybXFqdXdtZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDE4MjQsImV4cCI6MjA5NTExNzgyNH0.34KqORNSjw-FKeNGc6QA3b27ajOxS82-tFX8RlNaVZI'
const SPOONACULAR_KEY = 'da87acc782334a4499633cedbcf9566a'
const DELAY_MS = 500

const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

// British/regional → Spoonacular-recognized name
const NAME_MAP = {
  'Prawns':                  'shrimp',
  'Courgette':               'zucchini',
  'Aubergine':               'eggplant',
  'Coriander':               'cilantro',
  'Beef Mince':              'ground beef',
  'Chicken Mince':           'ground chicken',
  'Ginger (fresh)':          'ginger',
  'Oregano (fresh)':         'oregano',
  'Cumin Seeds (whole)':     'cumin',
  'Coriander (ground)':      'coriander',
  'Coriander Seeds (whole)': 'coriander',
  'Paprika (smoked)':        'smoked paprika',
  'Cloves (ground)':         'cloves',
  'Cloves (whole)':          'cloves',
  'Ribeye Steak':            'ribeye',
  'Rump Steak':              'beef rump steak',
  'Sirloin Steak':           'sirloin steak',
  "Za'atar":                 'zaatar',
  'Annatto Powder (achiote)':'annatto',
  'Asafoetida (hing)':       'asafoetida',
  'Black Mustard Seeds':     'mustard seeds',
  'Beef Mince (5% fat)':     'ground beef',
  'Beef Mince (10% fat)':    'ground beef',
  'Beef Mince (20% fat)':    'ground beef',
}

const delay = ms => new Promise(r => setTimeout(r, ms))

async function spoonacularPhoto(name) {
  const q = NAME_MAP[name] || name
  const url = `https://api.spoonacular.com/food/ingredients/search?query=${encodeURIComponent(q)}&number=1&apiKey=${SPOONACULAR_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Spoonacular HTTP ${res.status}`)
  const data = await res.json()
  const img = data.results?.[0]?.image
  return img ? `https://spoonacular.com/cdn/ingredients_250x250/${img}` : null
}

async function main() {
  console.log('Fetching ingredients without photos…')

  const { data: ings, error } = await db
    .from('ingredients')
    .select('id, name, cat, photo_url')
    .is('photo_url', null)
    .order('id')

  if (error) {
    if (error.code === '42703') {
      console.error('\n❌  photo_url column does not exist.')
      console.error('    Run this in the Supabase SQL editor first:')
      console.error('    ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS photo_url text;\n')
    } else {
      console.error('Supabase error:', error.message)
    }
    process.exit(1)
  }

  console.log(`Found ${ings.length} ingredients without photos.\n`)

  let got = 0, missed = 0, failed = 0

  for (let i = 0; i < ings.length; i++) {
    const ing = ings[i]
    const progress = `[${i + 1}/${ings.length}]`

    try {
      const photoUrl = await spoonacularPhoto(ing.name)

      if (photoUrl) {
        const { error: upErr } = await db
          .from('ingredients')
          .update({ photo_url: photoUrl })
          .eq('id', ing.id)

        if (upErr) {
          console.error(`  ${progress} ❌ DB update failed for "${ing.name}": ${upErr.message}`)
          failed++
        } else {
          console.log(`  ${progress} ✓  ${ing.name}`)
          got++
        }
      } else {
        console.log(`  ${progress} —  ${ing.name} (no match)`)
        missed++
      }
    } catch (e) {
      console.error(`  ${progress} ❌ ${ing.name}: ${e.message}`)
      failed++
      // on rate limit, pause longer
      if (e.message.includes('402') || e.message.includes('429')) {
        console.error('     Rate limit hit — pausing 60s…')
        await delay(60_000)
      }
    }

    if (i < ings.length - 1) await delay(DELAY_MS)
  }

  console.log(`\n━━━ Summary ━━━`)
  console.log(`  ✓  Got photo:    ${got}`)
  console.log(`  —  No match:     ${missed}  ← needs manual photo via /app/admin/photos`)
  console.log(`  ❌ Failed:       ${failed}`)
  console.log(`  Total processed: ${ings.length}`)

  if (missed > 0) {
    console.log(`\nTip: visit /app/admin/photos to assign photos manually for missed ingredients.`)
  }
  if (ings.length === 378 && got < 378) {
    console.log(`\nNote: Spoonacular free tier = 150 req/day. Run again tomorrow to continue.`)
  }
}

main()
