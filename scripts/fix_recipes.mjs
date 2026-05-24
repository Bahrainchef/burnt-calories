/**
 * One-time script: fix ZSF recipe names/tags in Supabase.
 * Usage: node scripts/fix_recipes.mjs
 */
import { createClient } from '@supabase/supabase-js'

const URL  = 'https://lglubafgeurmqjuwmerw.supabase.co'
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbHViYWZnZXVybXFqdXdtZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDE4MjQsImV4cCI6MjA5NTExNzgyNH0.34KqORNSjw-FKeNGc6QA3b27ajOxS82-tFX8RlNaVZI'

const db = createClient(URL, KEY, { auth: { persistSession: false } })

async function run() {
  console.log('Fetching all recipes…')
  const { data: recipes, error } = await db.from('recipes').select('id,name,tags,desc')
  if (error) { console.error('Fetch error:', error.message); process.exit(1) }
  console.log(`Found ${recipes.length} recipes`)

  const updates = [
    {
      match: r => r.name === 'ZSF Power Oat Bowl' || r.name?.includes('ZSF Power Oat'),
      patch: { name: 'Burnt Calories Power Oat Bowl', tags: ['Pre-Workout','High Protein','Meal Prep'] },
    },
    {
      match: r => r.name === 'Power Egg White Omelette',
      patch: { tags: ['Low Fat','High Protein','Breakfast'] },
    },
    {
      match: r => r.name === 'Rump Steak & Sweet Potato',
      patch: { tags: ['Iron Rich','Muscle Building','Performance'] },
    },
    {
      match: r => r.name === 'Post-Workout Recovery Shake',
      patch: { tags: ['Post-Workout','Recovery','Antioxidant'] },
    },
    {
      match: r => r.name === 'Casein Night Recovery Bowl',
      patch: { tags: ['Casein Protein','Night Recovery','Performance'] },
    },
  ]

  for (const { match, patch } of updates) {
    const targets = recipes.filter(match)
    for (const r of targets) {
      const { error: ue } = await db.from('recipes').update(patch).eq('id', r.id)
      if (ue) console.error(`  ✗ id=${r.id} "${r.name}":`, ue.message)
      else    console.log(`  ✓ Updated id=${r.id} "${r.name}"`)
    }
  }

  // Strip any remaining "ZSF " prefix from names
  const zsfNames = recipes.filter(r => r.name?.includes('ZSF '))
  for (const r of zsfNames) {
    const newName = r.name.replace(/ZSF /g, '')
    const { error: ue } = await db.from('recipes').update({ name: newName }).eq('id', r.id)
    if (ue) console.error(`  ✗ Rename id=${r.id}:`, ue.message)
    else    console.log(`  ✓ Renamed id=${r.id} → "${newName}"`)
  }

  console.log('Done.')
}

run()
