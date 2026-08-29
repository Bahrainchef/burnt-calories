'use client'
import { useState, useMemo } from 'react'
import { useIngredientPhoto } from './useIngredientPhoto'

const CAT_TABS = [
  { id: 'all',     label: 'All',               filter: () => true,                    cols: 5 },
  { id: 'protein', label: '🥩 Proteins',       filter: i => i.cat === 'Protein',      cols: 3, accent: '#C4530A', accentLight: '#FFF0E8' },
  { id: 'carbs',   label: '🌾 Carbs',          filter: i => i.cat === 'Carbohydrate', cols: 4, accent: '#C47C0A', accentLight: '#FDF3DC' },
  { id: 'vegs',    label: '🥦 Vegetables',     filter: i => i.cat === 'Vegetable',    cols: 5, accent: '#2D5A27', accentLight: '#EAF3E6' },
  { id: 'spices',  label: '🌶️ Spices & Herbs', filter: i => i.cat === 'Spice' || i.cat === 'Herb' || (i.cat === 'Other' && i.sub === 'Spices'), cols: 4, accent: '#7C5CBF', accentLight: '#F5F0FF' },
  { id: 'fruits',  label: '🍓 Fruits',         filter: i => i.cat === 'Fruit',        cols: 4, accent: '#C0446A', accentLight: '#FDEEF4' },
]

const CAT_ACCENT = {
  Protein: '#C4530A', Carbohydrate: '#C47C0A', Vegetable: '#2D5A27',
  Fruit: '#C0446A', Fat: '#E8621A', Dairy: '#7F77DD',
  Herb: '#7C5CBF', Spice: '#7C5CBF', Other: '#888780',
}
const CAT_LIGHT = {
  Protein: '#FFF0E8', Carbohydrate: '#FDF3DC', Vegetable: '#EAF3E6',
  Fruit: '#FDEEF4', Fat: '#FDEEE6', Dairy: '#EEEDFE',
  Herb: '#F5F0FF', Spice: '#F5F0FF', Other: '#F1EFE8',
}

// ── IngCard ──────────────────────────────────────────────────────────────────
function IngCard({ ing, catTab, onSelect }) {
  const photoUrl = useIngredientPhoto(ing.name)
  const [animating, setAnimating] = useState(false)
  const accent      = catTab?.accent      || CAT_ACCENT[ing.cat] || '#888'
  const accentLight = catTab?.accentLight || CAT_LIGHT[ing.cat]  || '#f5f5f5'
  const cal         = Math.round((ing.cal || 0) * (100 / (ing.ref || 100)))
  const initial     = (ing.name || '?')[0].toUpperCase()

  const handleClick = () => {
    setAnimating(true)
    setTimeout(() => setAnimating(false), 280)
    onSelect(ing)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(40,44,55,.10)',
        background: '#fff',
        transform: animating ? 'scale(0.88)' : 'scale(1)',
        transition: 'transform 0.22s ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(40,44,55,.18)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(40,44,55,.10)' }}
    >
      <div style={{ width: '100%', paddingTop: '100%', position: 'relative', overflow: 'hidden', background: accentLight }}>
        {photoUrl === undefined && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg,${accentLight} 0%,#f5f6f8 50%,${accentLight} 100%)`,
            backgroundSize: '200% 100%',
            animation: 'ingShimmer 1.4s ease-in-out infinite',
          }}/>
        )}
        {photoUrl && (
          <img src={photoUrl} alt={ing.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
        )}
        {photoUrl === null && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: accent, fontWeight: 700, background: accentLight }}>
            {initial}
          </div>
        )}
      </div>
      <div style={{ padding: '6px 8px 8px' }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#2b303a', lineHeight: 1.2, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ing.name}
        </div>
        <div style={{ fontSize: 11, color: '#7c8490' }}>{cal} cal/100g</div>
      </div>
    </div>
  )
}

// ── DetailModal ───────────────────────────────────────────────────────────────
function DetailModal({ ing, onClose }) {
  const photoUrl    = useIngredientPhoto(ing.name)
  const accent      = CAT_ACCENT[ing.cat] || '#888'
  const accentLight = CAT_LIGHT[ing.cat]  || '#f5f5f5'
  const r   = 100 / (ing.ref || 100)
  const cal = Math.round((ing.cal || 0) * r)
  const p   = Math.round((ing.p   || 0) * r)
  const c   = Math.round((ing.c   || 0) * r)
  const f   = Math.round((ing.f   || 0) * r)
  const fi  = Math.round((ing.fi  || 0) * r)
  const initial = (ing.name || '?')[0].toUpperCase()

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 20, maxWidth: 440, width: '100%', overflow: 'hidden', boxShadow: '0 32px 64px -24px rgba(0,0,0,0.4)' }}>
        {/* Photo area */}
        <div style={{ height: 220, background: accentLight, position: 'relative', overflow: 'hidden' }}>
          {photoUrl === undefined && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(90deg,${accentLight} 0%,#f5f6f8 50%,${accentLight} 100%)`,
              backgroundSize: '200% 100%',
              animation: 'ingShimmer 1.4s ease-in-out infinite',
            }}/>
          )}
          {photoUrl && <img src={photoUrl} alt={ing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
          {photoUrl === null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 72, color: accent, fontWeight: 700 }}>
              {initial}
            </div>
          )}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.35)', color: '#fff', cursor: 'pointer', fontSize: 20, lineHeight: '34px', textAlign: 'center', padding: 0 }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#2b303a', marginBottom: 6 }}>{ing.name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: accentLight, color: accent, fontWeight: 700, letterSpacing: '.02em' }}>{ing.cat}</span>
            <span style={{ fontSize: 11, color: '#9aa0ab' }}>per 100g</span>
          </div>

          {/* Macros row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
            {[['Cal', cal, '#E8621A'], ['Protein', `${p}g`, '#4A7C3F'], ['Carbs', `${c}g`, '#C47C0A'], ['Fat', `${f}g`, '#E8621A'], ['Fiber', `${fi}g`, '#0bb3a6']].map(([l, v, col]) => (
              <div key={l} style={{ background: '#f8f9fa', borderRadius: 10, padding: '9px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: col }}>{v}</div>
                <div style={{ fontSize: 9, color: '#9aa0ab', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          {(ing.benefits || []).length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7c8490', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.07em' }}>Benefits</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(ing.benefits || []).map((b, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: '#eaf3e6', color: '#2D5A27', fontWeight: 500 }}>{b}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── IngredientsTab ─────────────────────────────────────────────────────────────
export default function IngredientsTab({ ingredients }) {
  const [search,   setSearch]   = useState('')
  const [catTabId, setCatTabId] = useState('all')
  const [selIng,   setSelIng]   = useState(null)

  const catTab = CAT_TABS.find(t => t.id === catTabId) || CAT_TABS[0]

  const filtered = useMemo(() => {
    const q    = search.toLowerCase()
    const seen = new Set()
    return ingredients.filter(i => {
      const matchCat    = catTab.id === 'all' || catTab.filter(i)
      const matchSearch = !q || (i.name || '').toLowerCase().includes(q) || (i.cat || '').toLowerCase().includes(q)
      if (!matchCat || !matchSearch) return false
      if (seen.has(i.name)) return false
      seen.add(i.name)
      return true
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [ingredients, catTabId, search, catTab])

  return (
    <>
      <style>{`
        @keyframes ingShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .ing-tab-bar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e6e8ee', borderRadius: 14, padding: '10px 14px', background: '#f3f4f7', marginBottom: 14 }}>
        <span style={{ fontSize: 16, color: '#7c8490', flexShrink: 0 }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ingredients…"
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: '#2b303a', outline: 'none' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7c8490', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>

      {/* Category tabs */}
      <div className="ing-tab-bar" style={{ display: 'flex', borderBottom: '2px solid #e6e8ee', marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CAT_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setCatTabId(t.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: catTabId === t.id ? 700 : 400,
              color: catTabId === t.id ? '#2D5A27' : '#7c8490',
              borderBottom: catTabId === t.id ? '2px solid #2D5A27' : '2px solid transparent',
              marginBottom: -2,
              whiteSpace: 'nowrap',
              transition: 'color .15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (catTabId !== t.id) e.currentTarget.style.color = '#2b303a' }}
            onMouseLeave={e => { if (catTabId !== t.id) e.currentTarget.style.color = '#7c8490' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 11, color: '#9aa0ab', marginBottom: 16 }}>{filtered.length} ingredients</div>

      {/* Photo grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${catTab.cols}, 1fr)`, gap: 14 }}>
        {filtered.map(ing => (
          <IngCard
            key={ing.id}
            ing={ing}
            catTab={catTabId !== 'all' ? catTab : null}
            onSelect={setSelIng}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selIng && <DetailModal ing={selIng} onClose={() => setSelIng(null)} />}
    </>
  )
}
