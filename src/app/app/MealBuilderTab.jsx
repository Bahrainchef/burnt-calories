'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useIngredientPhoto } from "./useIngredientPhoto"

const C = {
  bg:        "#eef0f4",
  surface:   "#ffffff",
  row:       "#fafbfc",
  line:      "#e6e8ee",
  ink:       "#2b303a",
  sub:       "#7c8490",
  primary:   "#2D5A27",
  cta:       "#E8621A",
  protein:   "#36cf7c",
  carbs:     "#f7709f",
  fat:       "#ff8463",
  fiber:     "#0bb3a6",
  dark:      "#2b303a",
  darkTrack: "#3a414e",
  darkTile:  "#353c48",
}

const CIRC = 2 * Math.PI * 54

const ING_TABS = [
  { id: 'protein',    label: 'Proteins',              emoji: '🥩', filter: i => i.cat === 'Protein',      cols: 3, accent: '#C4530A', accentLight: '#FFF0E8' },
  { id: 'carbs',      label: 'Carbs & Starches',      emoji: '🌾', filter: i => i.cat === 'Carbohydrate', cols: 4, accent: '#C47C0A', accentLight: '#FDF3DC' },
  { id: 'vegetables', label: 'Vegetables',             emoji: '🥦', filter: i => i.cat === 'Vegetable',    cols: 5, accent: '#2D5A27', accentLight: '#EAF3E6' },
  { id: 'fruits',     label: 'Fruits',                emoji: '🍓', filter: i => i.cat === 'Fruit',        cols: 4, accent: '#C0446A', accentLight: '#FDEEF4' },
  { id: 'dressings',  label: 'Dressings · Sauces · Marinades · Pickles', emoji: '🫙', filter: null, placeholder: true, cols: 3, accent: '#7F77DD', accentLight: '#EEEDFE' },
]

const RECIPE_SECTIONS = [
  { label: 'High Performance',  cat: 'Lunch',     tags: ['High Performance'] },
  { label: 'Salads',            cat: 'Lunch',     tags: ['Salad']            },
  { label: 'Chicken',           cat: 'Lunch',     tags: ['Chicken']          },
  { label: 'Fish & Seafood',    cat: 'Dinner',    tags: ['Omega-3']          },
  { label: 'Grills & Platters', cat: 'Dinner',    tags: ['Grills & Platters']},
  { label: 'Breakfast',         cat: 'Breakfast', tags: ['Breakfast']        },
  { label: 'Lunch',             cat: 'Lunch',     tags: []                   },
  { label: 'Dinner',            cat: 'Dinner',    tags: []                   },
  { label: 'Snack',             cat: 'Snack',     tags: []                   },
  { label: 'Soups & Broths',    cat: 'Lunch',     tags: ['Bone Broth']       },
  { label: 'Plant Based',       cat: 'Dinner',    tags: ['Plant Based']      },
  { label: 'Pasta & Rice',      cat: 'Dinner',    tags: ['Pasta & Rice']     },
  { label: 'Dips & Sides',      cat: 'Lunch',     tags: ['Dips & Sides']     },
  { label: 'Meal Prep',         cat: 'Lunch',     tags: ['Meal Prep']        },
  { label: 'Low Calorie',       cat: 'Dinner',    tags: []                   },
]

const PLACEHOLDER_TABS = [
  "Classic French Dressing",
  "Asian Sesame Dressing",
  "Balsamic Dressing",
  "Korean Dressing",
  "Mushroom Sauce",
  "Korean BBQ Sauce",
  "Classic Marinade",
  "Pickled Red Onion",
]

function ingMacros(ing, amt) {
  if (!ing) return { cal: 0, p: 0, c: 0, f: 0, fi: 0 }
  const r = amt / (ing.ref || 100)
  return { cal: ing.cal * r, p: ing.p * r, c: ing.c * r, f: ing.f * r, fi: (ing.fi || 0) * r }
}

// ── DragGhost ─────────────────────────────────────────────────────────────────
function DragGhost({ name, ghostRef }) {
  return (
    <div ref={ghostRef} style={{
      position: "fixed", left: 0, top: 0, zIndex: 80,
      pointerEvents: "none",
      opacity: name ? 1 : 0,
      transition: "opacity .12s",
      transform: "translate(-999px,-999px)",
    }}>
      {name && (
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, padding: "10px 15px",
          boxShadow: "0 24px 46px -16px rgba(40,44,55,.5)",
          fontSize: 13, fontWeight: 700, color: C.ink,
        }}>
          {name}
        </div>
      )}
    </div>
  )
}

// ── IngPhotoCard ──────────────────────────────────────────────────────────────
function IngPhotoCard({ ing, tab, onAdd, isMatch, hasSearch }) {
  const photoUrl = useIngredientPhoto(ing.name)
  const [animating, setAnimating] = useState(false)
  const dimmed = hasSearch && !isMatch
  const cal = Math.round((ing.cal || 0) * (100 / (ing.ref || 100)))
  const initial = (ing.name || '?')[0].toUpperCase()

  const handleClick = () => {
    if (dimmed) return
    setAnimating(true)
    setTimeout(() => setAnimating(false), 280)
    onAdd(ing)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: dimmed ? 'default' : 'pointer',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(40,44,55,.10)',
        background: '#fff',
        transform: animating ? 'scale(0.88)' : 'scale(1)',
        transition: 'transform 0.22s ease, opacity .15s',
        userSelect: 'none',
        opacity: dimmed ? 0.25 : 1,
        pointerEvents: dimmed ? 'none' : 'auto',
      }}
      onMouseEnter={e => { if (!dimmed) e.currentTarget.style.boxShadow = '0 4px 16px rgba(40,44,55,.18)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(40,44,55,.10)' }}
    >
      {/* Square photo area */}
      <div style={{ width: '100%', paddingTop: '100%', position: 'relative', overflow: 'hidden', background: tab.accentLight }}>
        {photoUrl === undefined && (
          <div style={{ position: 'absolute', inset: 0, animation: 'mbShimmer 1.4s ease-in-out infinite', background: `linear-gradient(90deg,${tab.accentLight} 0%,#f5f6f8 50%,${tab.accentLight} 100%)`, backgroundSize: '200% 100%' }}/>
        )}
        {photoUrl && (
          <img src={photoUrl} alt={ing.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
        )}
        {photoUrl === null && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: tab.accent, fontWeight: 700, background: tab.accentLight }}>
            {initial}
          </div>
        )}
      </div>

      {/* Name + cal */}
      <div style={{ padding: '5px 7px 7px' }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: C.ink, lineHeight: 1.2, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ing.name}
        </div>
        <div style={{ fontSize: 11, color: C.sub }}>{cal} cal</div>
      </div>
    </div>
  )
}

// ── PlaceholderPhotoCard (dressings — coming soon, not tappable) ──────────────
function PlaceholderPhotoCard({ name, accent, accentLight }) {
  const initial = name[0].toUpperCase()
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(40,44,55,.07)', background: '#fff', position: 'relative', cursor: 'default' }}>
      <div style={{ width: '100%', paddingTop: '100%', position: 'relative', overflow: 'hidden', background: accentLight }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', color: accent, fontWeight: 700 }}>
          {initial}
        </div>
        {/* Coming soon overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#9a96cc', textTransform: 'uppercase', letterSpacing: '.06em' }}>Coming soon</span>
        </div>
      </div>
      <div style={{ padding: '5px 7px 7px' }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: '#b8b4e0', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
      </div>
    </div>
  )
}

// ── IngredientDropRow (ingredient row in the meal board) ───────────────────────
function IngredientDropRow({ row, ingredients, onGramsChange, onRemove }) {
  const ing = row.ingId ? ingredients.find(i => i.id === row.ingId) : null
  const displayName = ing ? ing.name : (row.name || '?')
  const m = ingMacros(ing, row.grams)

  return (
    <div style={{
      background: C.row, border: `1px solid ${C.line}`,
      borderRadius: 16, padding: "12px 14px",
      animation: "mbRowIn .35s ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{displayName}</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: C.ink, flexShrink: 0, marginLeft: 8 }}>
              {Math.round(m.cal)} <small style={{ color: "#9aa0ab", fontWeight: 400 }}>kcal</small>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7 }}>
            <input
              type="range" min={10} max={500} step={5}
              value={row.grams}
              onChange={e => onGramsChange(row.rowId, +e.target.value)}
              style={{ flex: 1, accentColor: C.primary }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3f49", width: 50, textAlign: "right" }}>
              {row.grams} g
            </span>
          </div>
          {ing ? (
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: C.sub }}>
              <span><b style={{ color: C.protein }}>P</b> {Math.round(m.p)}g</span>
              <span><b style={{ color: C.carbs }}>C</b> {Math.round(m.c)}g</span>
              <span><b style={{ color: C.fat }}>F</b> {Math.round(m.f)}g</span>
              {m.fi > 0 && <span><b style={{ color: C.fiber }}>Fb</b> {Math.round(m.fi)}g</span>}
            </div>
          ) : (
            <div style={{ fontSize: 10, color: '#9a96cc', marginTop: 4, fontStyle: 'italic' }}>Macros coming soon</div>
          )}
        </div>
        <button
          onClick={() => onRemove(row.rowId)}
          style={{
            border: "none", background: "#eef0f3", width: 27, height: 27,
            borderRadius: 8, color: "#9aa0ab", cursor: "pointer",
            flexShrink: 0, fontSize: 16, lineHeight: 1,
          }}
        >×</button>
      </div>
    </div>
  )
}

// ── SaveModal ──────────────────────────────────────────────────────────────────
function SaveModal({ rows, onClose, onSuccess }) {
  const [name,    setName]    = useState('')
  const [section, setSection] = useState(RECIPE_SECTIONS[0].label)
  const [serves,  setServes]  = useState(1)
  const [prep,    setPrep]    = useState(0)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState(null)

  const save = async () => {
    if (!name.trim()) { setErr('Recipe name is required'); return }
    setSaving(true); setErr(null)
    const sec  = RECIPE_SECTIONS.find(s => s.label === section) || RECIPE_SECTIONS[0]
    const ings = rows.filter(r => r.ingId).map(r => ({ id: r.ingId, amt: r.grams }))
    const { data, error } = await supabase.from('recipes').insert({
      name: name.trim(),
      cat:  sec.cat,
      serves, prep,
      cook: 0,
      ings,
      custom:    true,
      goal:      [],
      tags:      sec.tags,
      method:    [],
      photo_url: null,
      emoji:     '🍽️',
      desc:      '',
    }).select().single()
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSuccess(data, section)
  }

  const field = {
    width: '100%', border: `1px solid ${C.line}`, borderRadius: 10,
    padding: '9px 12px', fontSize: 13, color: C.ink, outline: 'none',
    background: '#f9fafc', boxSizing: 'border-box',
  }
  const label = { fontSize: 11, fontWeight: 700, color: C.sub, display: 'block', marginBottom: 5 }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28,
        width: '100%', maxWidth: 440,
        boxShadow: '0 32px 64px -24px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.ink, marginBottom: 22 }}>Save recipe</div>

        <div style={{ marginBottom: 14 }}>
          <span style={label}>Recipe name *</span>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="e.g. Post-workout chicken bowl"
            style={field}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <span style={label}>Section</span>
          <select value={section} onChange={e => setSection(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
            {RECIPE_SECTIONS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <span style={label}>Serves</span>
            <input type="number" min={1} max={20} value={serves}
              onChange={e => setServes(Math.max(1, +e.target.value))} style={field} />
          </div>
          <div>
            <span style={label}>Prep time (min)</span>
            <input type="number" min={0} max={240} value={prep}
              onChange={e => setPrep(Math.max(0, +e.target.value))} style={field} />
          </div>
        </div>

        {err && (
          <div style={{ fontSize: 12, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, border: `1px solid ${C.line}`, background: C.surface,
            borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13,
            cursor: 'pointer', color: C.ink,
          }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{
            flex: 2, border: 'none', background: saving ? '#c4814e' : C.cta, color: '#fff',
            borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13,
            cursor: saving ? 'default' : 'pointer',
            boxShadow: saving ? 'none' : '0 10px 22px -10px rgba(232,98,26,.65)',
            transition: 'background .15s',
          }}>
            {saving ? 'Saving…' : 'Save recipe'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 300, background: C.primary, color: '#fff',
      borderRadius: 12, padding: '12px 22px', fontWeight: 700, fontSize: 14,
      boxShadow: '0 8px 24px rgba(0,0,0,0.22)', whiteSpace: 'nowrap',
      animation: 'mbRowIn .3s ease',
    }}>
      {msg}
    </div>
  )
}

// ── MacroPanel ────────────────────────────────────────────────────────────────
function MacroPanel({ totals, target, setTarget, onAutoFit, onSave }) {
  const kcalPct    = target.kcal ? Math.min(1, totals.kcal / target.kcal) : 0
  const kcalOffset = CIRC * (1 - kcalPct)
  const proteinPct = target.protein ? Math.min(100, Math.round((totals.protein / target.protein) * 100)) : 0
  const pK = totals.protein * 4, cK = totals.carbs * 4, fK = totals.fat * 9
  const sum = pK + cK + fK || 1
  const split = { p: (pK / sum) * 100, c: (cK / sum) * 100, f: (fK / sum) * 100 }

  const card = {
    background: C.surface, border: `1px solid ${C.line}`, borderRadius: 22,
    boxShadow: "0 1px 2px rgba(40,44,55,.04),0 18px 40px -28px rgba(40,44,55,.18)",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: C.dark, color: "#fff", borderRadius: 24, padding: 20 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#c7ccd6" }}>Meal totals</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="65" cy="65" r="54" fill="none" stroke={C.darkTrack} strokeWidth="12" />
              <circle
                cx="65" cy="65" r="54" fill="none"
                stroke={C.primary} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={kcalOffset}
                style={{ transition: "stroke-dashoffset .55s cubic-bezier(.2,.8,.2,1)" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-.02em" }}>{totals.kcal}</span>
              <span style={{ fontSize: 10, color: "#99a0ac" }}>/ {target.kcal} kcal</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#99a0ac", marginBottom: 5 }}>
              Protein <b style={{ color: "#fff" }}>{totals.protein}g</b> / {target.protein}g
            </div>
            <div style={{ height: 8, borderRadius: 99, background: C.darkTrack, overflow: "hidden", marginBottom: 12 }}>
              <div style={{
                height: "100%", width: `${proteinPct}%`, background: C.protein,
                transition: "width .55s cubic-bezier(.2,.8,.2,1)",
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#99a0ac", marginBottom: 6 }}>Energy split</div>
            <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: C.darkTrack }}>
              <div style={{ width: `${split.p}%`, background: C.protein }} />
              <div style={{ width: `${split.c}%`, background: C.carbs }} />
              <div style={{ width: `${split.f}%`, background: C.fat }} />
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[["Carbs", totals.carbs, C.carbs], ["Fat", totals.fat, C.fat], ["Fiber", totals.fiber, C.fiber]].map(([label, val, col]) => (
            <div key={label} style={{ background: C.darkTile, borderRadius: 12, padding: "9px 11px" }}>
              <div style={{ fontSize: 11, color: "#99a0ac", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />{label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, marginTop: 2 }}>
                {val}<small style={{ color: "#99a0ac", fontWeight: 400 }}> g</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding: "16px 16px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: C.ink }}>Tune to your target</div>
        <TargetLabel l="Calorie target" v={`${target.kcal} kcal`} />
        <input
          type="range" min={300} max={2000} step={10} value={target.kcal}
          onChange={e => setTarget(t => ({ ...t, kcal: +e.target.value }))}
          style={{ width: "100%", accentColor: C.primary, marginBottom: 14 }}
        />
        <TargetLabel l="Protein target" v={`${target.protein} g`} />
        <input
          type="range" min={10} max={200} step={5} value={target.protein}
          onChange={e => setTarget(t => ({ ...t, protein: +e.target.value }))}
          style={{ width: "100%", accentColor: C.primary, marginBottom: 16 }}
        />
        <button onClick={onAutoFit} style={{
          width: "100%", border: "none", background: C.cta, color: "#fff",
          borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13, cursor: "pointer",
          boxShadow: "0 10px 22px -10px rgba(232,98,26,.65)", marginBottom: 8,
        }}>
          Auto-fit portions to target
        </button>
        <button onClick={onSave} style={{
          width: "100%", border: `1px solid ${C.line}`, background: C.surface,
          borderRadius: 12, padding: 11, fontWeight: 700, fontSize: 13, cursor: "pointer", color: C.ink,
        }}>
          Save this meal
        </button>
      </div>
    </div>
  )
}

function TargetLabel({ l, v }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      fontSize: 12, fontWeight: 600, color: "#5b616d", marginBottom: 7,
    }}>
      <span>{l}</span>
      <span style={{ color: C.ink }}>{v}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MealBuilderTab({ recipes, ingredients, onRecipeAdded }) {
  const rowIdRef = useRef(0)

  const [rows,          setRows]          = useState([])
  const [mealName,      setMealName]      = useState("My meal")
  const [target,        setTarget]        = useState({ kcal: 700, protein: 55 })
  const [ingSearch,     setIngSearch]     = useState('')
  const [activeIngTab,  setActiveIngTab]  = useState('protein')
  const [dragName,      setDragName]      = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [toast,         setToast]         = useState(null)

  const [usage, setUsage] = useState(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('mb_ingredient_usage') || '{}') }
    catch { return {} }
  })

  const resetUsage = () => {
    try { localStorage.removeItem('mb_ingredient_usage') } catch {}
    setUsage({})
  }

  const dragRef  = useRef(null)
  const ghostRef = useRef(null)
  const dropRef  = useRef(null)

  // Active tab config
  const activeTab = useMemo(() => ING_TABS.find(t => t.id === activeIngTab) || ING_TABS[0], [activeIngTab])

  // Items for the active tab sorted by usage desc then alphabetically
  const activeTabItems = useMemo(() => {
    if (!activeTab || activeTab.placeholder) return []
    return ingredients
      .filter(activeTab.filter)
      .slice()
      .sort((a, b) => {
        const ca = usage[a.id] || 0
        const cb = usage[b.id] || 0
        if (cb !== ca) return cb - ca
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [ingredients, usage, activeTab])

  // Ingredient IDs that match the search query
  const matchIds = useMemo(() => {
    if (!ingSearch) return null
    const q = ingSearch.toLowerCase()
    const ids = new Set()
    ingredients.forEach(ing => {
      if ((ing.name || '').toLowerCase().includes(q) || (ing.sub || '').toLowerCase().includes(q))
        ids.add(ing.id)
    })
    return ids
  }, [ingSearch, ingredients])

  // Running meal totals
  const totals = useMemo(() => {
    let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0
    rows.forEach(row => {
      if (!row.ingId) return
      const ing = ingredients.find(i => i.id === row.ingId)
      const m = ingMacros(ing, row.grams)
      kcal += m.cal; protein += m.p; carbs += m.c; fat += m.f; fiber += m.fi
    })
    return {
      kcal:    Math.round(kcal),
      protein: Math.round(protein),
      carbs:   Math.round(carbs),
      fat:     Math.round(fat),
      fiber:   Math.round(fiber),
    }
  }, [rows, ingredients])

  const addItem = useCallback((item) => {
    rowIdRef.current += 1
    if (item.id === null) {
      setRows(prev => [...prev, { rowId: rowIdRef.current, ingId: null, name: item.name, grams: 100 }])
    } else {
      setRows(prev => [...prev, { rowId: rowIdRef.current, ingId: item.id, name: null, grams: item.ref || 100 }])
      setUsage(prev => {
        const next = { ...prev, [item.id]: (prev[item.id] || 0) + 1 }
        try { localStorage.setItem('mb_ingredient_usage', JSON.stringify(next)) } catch {}
        return next
      })
    }
  }, [])

  // Pointer drag: ingredient → board drop zone
  useEffect(() => {
    const overDrop = (e) => {
      const el = dropRef.current; if (!el) return false
      const r = el.getBoundingClientRect()
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    }
    const setHot = (on) => {
      const el = dropRef.current; if (!el) return
      el.style.boxShadow  = on ? `inset 0 0 0 2px ${C.primary},0 30px 64px -28px rgba(45,90,39,.4)` : ""
      el.style.background = on ? "linear-gradient(180deg,#eaf3e6,#ffffff)" : ""
      el.style.transform  = on ? "scale(1.008)" : ""
    }
    const onMove = (e) => {
      const d = dragRef.current; if (!d) return
      if (!d.active) {
        if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return
        d.active = true
        setDragName(d.item.name)
        if (d.el) d.el.style.opacity = "0.35"
      }
      if (ghostRef.current)
        ghostRef.current.style.transform =
          `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%) rotate(-4deg)`
      setHot(overDrop(e))
    }
    const onUp = (e) => {
      const d = dragRef.current; if (!d) return
      if (d.active) {
        if (d.el) d.el.style.opacity = ""
        if (overDrop(e)) addItem(d.item)
      } else {
        addItem(d.item)
      }
      setHot(false)
      dragRef.current = null
      setDragName(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup",   onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup",   onUp)
    }
  }, [addItem])

  const setGrams  = (rowId, grams) => setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, grams } : r))
  const removeRow = (rowId)        => setRows(prev => prev.filter(r => r.rowId !== rowId))

  const autoFit = () => {
    if (!totals.kcal) return
    const factor = target.kcal / totals.kcal
    setRows(prev => prev.map(r => ({
      ...r, grams: Math.max(10, Math.min(500, Math.round(r.grams * factor / 5) * 5)),
    })))
  }

  const saveMeal = () => {
    if (!rows.length) return
    setShowSaveModal(true)
  }

  const handleSaveSuccess = (insertedRecord, sectionLabel) => {
    setShowSaveModal(false)
    setRows([])
    setMealName("My meal")
    setToast(`✓ Recipe saved to ${sectionLabel}`)
    setTimeout(() => setToast(null), 3000)
    if (typeof onRecipeAdded === 'function') onRecipeAdded(insertedRecord)
  }

  const [narrow, setNarrow] = useState(typeof window !== "undefined" ? window.innerWidth < 1100 : false)
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 1100)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const gridStyle = narrow
    ? { display: "flex", flexDirection: "column", gap: 16 }
    : { display: "grid", gridTemplateColumns: "2fr 3fr", gap: 16, alignItems: "start" }

  const cardBase = {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 22,
    boxShadow: "0 1px 2px rgba(40,44,55,.04),0 18px 40px -28px rgba(40,44,55,.18)",
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "0 0 40px" }}>
      <style>{`
        @keyframes mbRowIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mbShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .mb-tab-bar::-webkit-scrollbar { display: none; }
        .mb-photo-grid::-webkit-scrollbar { width: 4px; }
        .mb-photo-grid::-webkit-scrollbar-track { background: transparent; }
        .mb-photo-grid::-webkit-scrollbar-thumb { background: #d4d7df; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 1420, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={gridStyle}>

          {/* ── LEFT: drop zone + totals + targets ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* My meal drop zone */}
            <div
              ref={dropRef}
              style={{
                ...cardBase, borderRadius: 24, padding: 18,
                minHeight: 300,
                transition: "transform .18s,box-shadow .18s,background .18s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <input
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  style={{
                    border: "none", background: "transparent",
                    fontWeight: 800, fontSize: 22, flex: 1, minWidth: 0,
                    color: C.ink, letterSpacing: "-.01em",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: C.sub }}>
                    {rows.length} {rows.length === 1 ? "ingredient" : "ingredients"}
                  </span>
                  {rows.length > 0 && (
                    <button
                      onClick={() => setRows([])}
                      style={{
                        fontSize: 11, padding: "4px 10px", cursor: "pointer",
                        border: `1px solid ${C.line}`, borderRadius: 8,
                        background: C.surface, color: C.sub,
                      }}
                    >Clear</button>
                  )}
                </div>
              </div>

              {rows.length === 0 ? (
                <div style={{
                  border: "2px dashed #d4d7df", borderRadius: 18, minHeight: 200,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 10, color: "#9aa0ab",
                }}>
                  <span style={{ fontSize: 38 }}>🍳</span>
                  <span style={{ fontWeight: 700, fontSize: 17, color: "#6b7280" }}>
                    Click an ingredient card to add it
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {rows.map(row => (
                    <IngredientDropRow
                      key={row.rowId}
                      row={row}
                      ingredients={ingredients}
                      onGramsChange={setGrams}
                      onRemove={removeRow}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Meal totals + Tune to target + Save */}
            <MacroPanel
              totals={totals}
              target={target}
              setTarget={setTarget}
              onAutoFit={autoFit}
              onSave={saveMeal}
            />

            <div style={{ minHeight: 22 }}>
              {Object.keys(usage).length > 0 && (
                <button
                  onClick={resetUsage}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 10, color: 'transparent', padding: '4px 0',
                    textDecoration: 'underline', alignSelf: 'flex-start',
                    transition: 'color .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.sub }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'transparent' }}
                >
                  Reset favourites
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT: tabbed photo ingredient board ── */}
          <section style={{ ...cardBase, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 500 }}>

            {/* Tab bar */}
            <div className="mb-tab-bar" style={{
              display: 'flex',
              borderBottom: `2px solid ${C.line}`,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              padding: '0 10px',
              flexShrink: 0,
            }}>
              {ING_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveIngTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '11px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: activeIngTab === tab.id ? 700 : 400,
                    color: activeIngTab === tab.id ? C.primary : C.sub,
                    borderBottom: activeIngTab === tab.id ? `2px solid ${C.primary}` : '2px solid transparent',
                    marginBottom: -2,
                    whiteSpace: 'nowrap',
                    transition: 'color .15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (activeIngTab !== tab.id) e.currentTarget.style.color = C.ink }}
                  onMouseLeave={e => { if (activeIngTab !== tab.id) e.currentTarget.style.color = C.sub }}
                >
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Search bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: `1px solid ${C.line}`, borderRadius: 12,
                padding: '8px 12px', background: '#f3f4f7', marginBottom: 10,
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, color: C.sub, flexShrink: 0 }}>🔍</span>
                <input
                  value={ingSearch}
                  onChange={e => setIngSearch(e.target.value)}
                  placeholder="Search ingredients…"
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: C.ink, outline: 'none' }}
                />
                {ingSearch && (
                  <button
                    onClick={() => setIngSearch('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.sub, fontSize: 18, lineHeight: 1, padding: 0 }}
                  >×</button>
                )}
              </div>

              {/* Photo grid */}
              <div className="mb-photo-grid" style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${activeTab.cols}, 1fr)`,
                gap: 8,
                overflowY: 'auto',
                flex: 1,
                alignContent: 'start',
              }}>
                {activeTab.placeholder
                  ? PLACEHOLDER_TABS.map((name, i) => (
                      <PlaceholderPhotoCard key={i} name={name} accent={activeTab.accent} accentLight={activeTab.accentLight} />
                    ))
                  : activeTabItems.map(ing => (
                      <IngPhotoCard
                        key={ing.id}
                        ing={ing}
                        tab={activeTab}
                        onAdd={addItem}
                        isMatch={matchIds ? matchIds.has(ing.id) : true}
                        hasSearch={!!ingSearch}
                      />
                    ))
                }
              </div>
            </div>
          </section>
        </div>
      </div>

      <DragGhost name={dragName} ghostRef={ghostRef} />

      {showSaveModal && (
        <SaveModal
          rows={rows}
          onClose={() => setShowSaveModal(false)}
          onSuccess={handleSaveSuccess}
        />
      )}

      <Toast msg={toast} />
    </div>
  )
}
