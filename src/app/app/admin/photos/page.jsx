'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

const PRIMARY   = '#2D5A27'
const CAT_TABS  = ['All','Protein','Carbohydrate','Vegetable','Fruit','Spice','Herb','Other']
const CAT_COLOR = {
  Protein:'#C4530A', Carbohydrate:'#C47C0A', Vegetable:'#2D5A27',
  Fruit:'#C0446A', Spice:'#7C5CBF', Herb:'#7C5CBF', Other:'#888780', Fat:'#E8621A', Dairy:'#7F77DD',
}
const CAT_BG = {
  Protein:'#FFF0E8', Carbohydrate:'#FDF3DC', Vegetable:'#EAF3E6',
  Fruit:'#FDEEF4', Spice:'#F5F0FF', Herb:'#F5F0FF', Other:'#F1EFE8', Fat:'#FDEEE6', Dairy:'#EEEDFE',
}
const CAT_EMOJI = {
  Protein:'🥩', Carbohydrate:'🌾', Vegetable:'🥦',
  Fruit:'🍓', Spice:'🌶️', Herb:'🌿', Other:'🫙', Fat:'🫒', Dairy:'🧀',
}

// ── EditModal ──────────────────────────────────────────────────────────────────
function EditModal({ ing, onClose, onSaved }) {
  const [query,      setQuery]      = useState(ing.name)
  const [searching,  setSearching]  = useState(false)
  const [spoonUrls,  setSpoonUrls]  = useState([])
  const [pexelsUrls, setPexelsUrls] = useState([])
  const [pasteUrl,   setPasteUrl]   = useState('')
  const [selected,   setSelected]   = useState(ing.photo_url || null)
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState(null)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    setSpoonUrls([]); setPexelsUrls([])
    const [sRes, pRes] = await Promise.all([
      fetch(`/api/spoonacular?q=${encodeURIComponent(query)}&n=6`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/pexels?q=${encodeURIComponent(query + ' food ingredient')}&n=6`).then(r => r.json()).catch(() => ({})),
    ])
    setSpoonUrls(sRes.results || [])
    setPexelsUrls(pRes.results || [])
    setSearching(false)
  }

  const save = async () => {
    const url = pasteUrl.trim() || selected
    setSaving(true); setErr(null)
    const { error } = await supabase.from('ingredients').update({ photo_url: url || null }).eq('id', ing.id)
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved({ ...ing, photo_url: url || null })
    onClose()
  }

  const remove = async () => {
    setSaving(true); setErr(null)
    const { error } = await supabase.from('ingredients').update({ photo_url: null }).eq('id', ing.id)
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved({ ...ing, photo_url: null })
    onClose()
  }

  const bg   = CAT_BG[ing.cat]   || '#f5f5f5'
  const col  = CAT_COLOR[ing.cat] || '#888'
  const emoji= CAT_EMOJI[ing.cat] || '🍽️'
  const displayPhoto = pasteUrl.trim() || selected

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:680, maxHeight:'90vh', overflow:'auto', boxShadow:'0 32px 64px -24px rgba(0,0,0,0.45)' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #e6e8ee', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:'#1a1a1a' }}>{ing.name}</div>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:bg, color:col, fontWeight:700 }}>{ing.cat}</span>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#f0f1f3', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, color:'#666' }}>×</button>
        </div>

        <div style={{ padding:24 }}>
          {/* Current photo preview */}
          <div style={{ width:'100%', height:200, borderRadius:12, overflow:'hidden', background:bg, marginBottom:20, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {displayPhoto
              ? <img src={displayPhoto} alt={ing.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => { if (pasteUrl.trim()) setPasteUrl(''); else setSelected(null) }} />
              : <div style={{ textAlign:'center' }}><div style={{ fontSize:48 }}>{emoji}</div><div style={{ fontSize:12, color:'#999', marginTop:4 }}>No photo</div></div>
            }
          </div>

          {/* Search */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Search for a photo…"
              style={{ flex:1, border:'1px solid #e0e2e8', borderRadius:10, padding:'9px 13px', fontSize:13, outline:'none' }}
            />
            <button onClick={search} disabled={searching}
              style={{ padding:'9px 18px', background:PRIMARY, color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:searching ? 'default' : 'pointer', opacity:searching ? 0.7 : 1 }}>
              {searching ? '…' : 'Search'}
            </button>
          </div>

          {/* Spoonacular results */}
          {spoonUrls.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#7c8490', marginBottom:8, textTransform:'uppercase', letterSpacing:'.05em' }}>Spoonacular</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                {spoonUrls.map((url, i) => (
                  <div key={i} onClick={() => { setSelected(url); setPasteUrl('') }}
                    style={{ aspectRatio:'1', borderRadius:8, overflow:'hidden', cursor:'pointer', border: selected === url && !pasteUrl ? `3px solid ${PRIMARY}` : '3px solid transparent', position:'relative' }}>
                    <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    {selected === url && !pasteUrl && (
                      <div style={{ position:'absolute', top:3, right:3, background:PRIMARY, color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pexels results */}
          {pexelsUrls.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#7c8490', marginBottom:8, textTransform:'uppercase', letterSpacing:'.05em' }}>Pexels</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                {pexelsUrls.map((url, i) => (
                  <div key={i} onClick={() => { setSelected(url); setPasteUrl('') }}
                    style={{ aspectRatio:'1', borderRadius:8, overflow:'hidden', cursor:'pointer', border: selected === url && !pasteUrl ? `3px solid ${PRIMARY}` : '3px solid transparent', position:'relative' }}>
                    <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    {selected === url && !pasteUrl && (
                      <div style={{ position:'absolute', top:3, right:3, background:PRIMARY, color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paste URL */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#7c8490', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Or paste a direct image URL</div>
            <input
              value={pasteUrl} onChange={e => { setPasteUrl(e.target.value); setSelected(null) }}
              placeholder="https://…"
              style={{ width:'100%', border:'1px solid #e0e2e8', borderRadius:10, padding:'9px 13px', fontSize:13, outline:'none', boxSizing:'border-box' }}
            />
          </div>

          {err && <div style={{ fontSize:12, color:'#e53e3e', background:'#fff5f5', border:'1px solid #fed7d7', borderRadius:8, padding:'8px 12px', marginBottom:14 }}>{err}</div>}

          {/* Actions */}
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={onClose} style={{ flex:1, border:'1px solid #e0e2e8', background:'#fff', borderRadius:12, padding:'11px 0', fontWeight:700, fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
            <button onClick={save} disabled={saving || (!selected && !pasteUrl.trim())}
              style={{ flex:2, border:'none', background:PRIMARY, color:'#fff', borderRadius:12, padding:'11px 0', fontWeight:700, fontSize:13, cursor:'pointer', opacity: saving || (!selected && !pasteUrl.trim()) ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Save photo'}
            </button>
          </div>
          {ing.photo_url && (
            <div style={{ textAlign:'center', marginTop:12 }}>
              <button onClick={remove} disabled={saving} style={{ background:'none', border:'none', color:'#e53e3e', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>Remove photo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── IngCard ────────────────────────────────────────────────────────────────────
function IngCard({ ing, onEdit }) {
  const [hovered, setHovered] = useState(false)
  const bg    = CAT_BG[ing.cat]    || '#f5f5f5'
  const col   = CAT_COLOR[ing.cat] || '#888'
  const emoji = CAT_EMOJI[ing.cat] || '🍽️'

  return (
    <div onClick={() => onEdit(ing)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius:12, overflow:'hidden', background:'#fff', cursor:'pointer',
        boxShadow: hovered ? '0 8px 24px rgba(40,44,55,.18)' : '0 2px 8px rgba(40,44,55,.10)',
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        transition:'transform 0.15s ease, box-shadow 0.15s',
        position:'relative',
      }}>
      {/* Photo area */}
      <div style={{ width:'100%', paddingTop:'100%', position:'relative', overflow:'hidden', background:bg }}>
        {ing.photo_url
          ? <img src={ing.photo_url} alt={ing.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
              <span style={{ fontSize:'1.8rem' }}>{emoji}</span>
              <span style={{ fontSize:10, fontWeight:700, color:col }}>{(ing.name||'?')[0]}</span>
            </div>
        }
        {/* Edit overlay */}
        {hovered && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:22 }}>✏️</span>
          </div>
        )}
        {/* Has-photo indicator */}
        {ing.photo_url && (
          <div style={{ position:'absolute', top:6, right:6, background:PRIMARY, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:8, color:'#fff' }}>✓</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:'8px 10px' }}>
        <div style={{ fontWeight:600, fontSize:12, color:'#1a1a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{ing.name}</div>
        <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:bg, color:col, fontWeight:700 }}>{ing.cat}</span>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminPhotosPage() {
  const [ings,    setIngs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [catTab,  setCatTab]  = useState('All')
  const [search,  setSearch]  = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    supabase.from('ingredients').select('id, name, cat, sub, photo_url').order('name')
      .then(({ data, error }) => {
        if (!error) setIngs(data || [])
        setLoading(false)
      })
  }, [])

  const handleSaved = (updated) => {
    setIngs(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ings.filter(i => {
      const matchCat = catTab === 'All' || i.cat === catTab
      const matchQ   = !q || (i.name || '').toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [ings, catTab, search])

  const withPhoto    = ings.filter(i => i.photo_url).length
  const withoutPhoto = ings.length - withPhoto

  return (
    <div style={{ minHeight:'100vh', background:'#eef0f4', fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        .ap-tab-bar::-webkit-scrollbar { display:none }
      `}</style>

      {/* Header */}
      <div style={{ background:PRIMARY, padding:'18px 24px 16px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:22, color:'#fff', letterSpacing:'-.01em' }}>Ingredient Photo Manager</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginTop:3 }}>Click any card to update its photo</div>
            </div>
            <div style={{ display:'flex', gap:16, fontSize:13, color:'rgba(255,255,255,0.85)' }}>
              <span>✓ {withPhoto} with photo</span>
              <span>— {withoutPhoto} without</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'20px 20px 40px' }}>

        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1px solid #e0e2e8', borderRadius:12, padding:'10px 14px', marginBottom:14 }}>
          <span style={{ color:'#aaa', fontSize:15 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ingredients…"
            style={{ flex:1, border:'none', fontSize:13, color:'#1a1a1a', outline:'none', background:'transparent' }} />
          {search && <button onClick={() => setSearch('')} style={{ border:'none', background:'none', color:'#aaa', fontSize:18, cursor:'pointer', padding:0 }}>×</button>}
        </div>

        {/* Category tabs */}
        <div className="ap-tab-bar" style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', marginBottom:20, borderBottom:'2px solid #e0e2e8', paddingBottom:0 }}>
          {CAT_TABS.map(t => (
            <button key={t} onClick={() => setCatTab(t)} style={{
              padding:'8px 16px', border:'none', background:'none', cursor:'pointer', fontSize:13,
              fontWeight: catTab===t ? 700 : 400,
              color: catTab===t ? PRIMARY : '#7c8490',
              borderBottom: catTab===t ? `2px solid ${PRIMARY}` : '2px solid transparent',
              marginBottom:-2, flexShrink:0, whiteSpace:'nowrap',
            }}>
              {t === 'All' ? `All (${ings.length})` : t}
            </button>
          ))}
        </div>

        {/* Count */}
        <div style={{ fontSize:11, color:'#9aa0ab', marginBottom:16 }}>{filtered.length} ingredients</div>

        {/* Grid */}
        {loading
          ? <div style={{ textAlign:'center', padding:60, color:'#aaa', fontSize:14 }}>Loading…</div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12 }}>
              {filtered.map(ing => (
                <IngCard key={ing.id} ing={ing} onEdit={setEditing} />
              ))}
            </div>
        }
      </div>

      {editing && <EditModal ing={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  )
}
