/**
 * Run once: adds photo_url column + creates recipe-images storage bucket.
 * Usage: SUPABASE_SERVICE_KEY="<service_role_key>" node scripts/setup_photo.mjs
 *
 * Service role key: Supabase Dashboard → Settings → API → service_role (secret)
 */
import { createClient } from '@supabase/supabase-js'

const URL = 'https://lglubafgeurmqjuwmerw.supabase.co'
const KEY  = process.env.SUPABASE_SERVICE_KEY

if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY. Get it from:')
  console.error('  Supabase Dashboard → Settings → API → service_role (secret key)')
  process.exit(1)
}

const db = createClient(URL, KEY, { auth: { persistSession: false } })

// ── 1. Add photo_url column via Management API SQL endpoint ────────────────────
console.log('Adding photo_url column…')
const sqlRes = await fetch(
  `https://api.supabase.com/v1/projects/lglubafgeurmqjuwmerw/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photo_url TEXT;' }),
  }
)

if (sqlRes.ok) {
  console.log('✓ photo_url column added (or already existed)')
} else {
  const txt = await sqlRes.text()
  console.warn('⚠ Management API SQL failed:', sqlRes.status, txt)
  console.warn('  → Run this manually in the Supabase SQL editor:')
  console.warn('    ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photo_url TEXT;')
}

// ── 2. Create recipe-images storage bucket ─────────────────────────────────────
console.log('Creating recipe-images bucket…')
const { data, error } = await db.storage.createBucket('recipe-images', { public: true })

if (error?.message?.includes('already exists') || error?.message?.includes('The resource already exists')) {
  console.log('✓ recipe-images bucket already exists')
} else if (error) {
  console.error('✗ Bucket error:', error.message)
} else {
  console.log('✓ recipe-images bucket created (public read)')
}
