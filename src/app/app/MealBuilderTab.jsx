'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from "react"

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

const COLS = [
  { id: 'protein',    label: 'Proteins',                                 accent: '#C4530A', accentLight: '#FFF0E8', filter: (i) => i.cat === 'Protein',      wider: true },
  { id: 'carbs',      label: 'Carbs & Starches',                         accent: '#C47C0A', accentLight: '#FDF3DC', filter: (i) => i.cat === 'Carbohydrate' },
  { id: 'vegetables', label: 'Vegetables',                                accent: '#2D5A27', accentLight: '#EAF3E6', filter: (i) => i.cat === 'Vegetable'    },
  { id: 'fruits',     label: 'Fruits',                                    accent: '#C0446A', accentLight: '#FDEEF4', filter: (i) => i.cat === 'Fruit'        },
  { id: 'dressings',  label: 'Dressings · Sauces · Marinades · Pickles', accent: '#7F77DD', accentLight: '#EEEDFE', filter: null, placeholder: true           },
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

// ── DragGhost ─────────────────────────────────────────────────────────────
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

// ── IngredientTab ─────────────────────────────────────────────────────────
function IngredientTab({ ing, col, onPointerDown, isMatch, hasSearch, usageCount }) {
  const m = ingMacros(ing, 100)
  const dimmed = hasSearch && !isMatch
  const isFav  = usageCount >= 3
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        background:    dimmed ? '#f7f8fa' : col.accentLight,
        borderLeft:    `3px solid ${dimmed ? '#d4d7df' : col.accent}`,
        borderRadius:  10,
        padding:       '8px 9px',
        cursor:        dimmed ? 'default' : 'grab',
        touchAction:   'none',
        userSelect:    'none',
        boxShadow:     isFav ? `0 1px 3px rgba(40,44,55,.07), inset 0 0 0 1px ${col.accent}44` : '0 1px 3px rgba(40,44,55,.07)',
        opacity:       dimmed ? 0.3 : 1,
        transition:    'opacity .15s, transform .15s, box-shadow .15s',
        marginBottom:  6,
        pointerEvents: dimmed ? 'none' : 'auto',
      }}
      onMouseEnter={e => { if (!dimmed) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(40,44,55,.14)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isFav ? `0 1px 3px rgba(40,44,55,.07), inset 0 0 0 1px ${col.accent}44` : '0 1px 3px rgba(40,44,55,.07)' }}
    >
      <div style={{ fontWeight: 700, fontSize: 12, color: C.ink, lineHeight: 1.3, marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{ing.name}</span>
        {isFav && <span style={{ fontSize: 9, lineHeight: 1, flexShrink: 0, marginLeft: 4 }}>⭐</span>}
      </div>
      <div style={{ fontSize: 10, color: C.sub }}>
        <span style={{ color: col.accent, fontWeight: 700 }}>{Math.round(m.cal)}</span>
        {' cal · '}
        <span style={{ color: '#36cf7c' }}>{Math.round(m.p)}P</span>
        {' · '}
        <span style={{ color: '#f7709f' }}>{Math.round(m.c)}C</span>
        {' · '}
        <span style={{ color: '#ff8463' }}>{Math.round(m.f)}F</span>
      </div>
    </div>
  )
}

// ── PlaceholderTab (dressings column — draggable whole items) ─────────────
function PlaceholderTab({ name, onPointerDown }) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        background:   '#f5f4fc',
        borderLeft:   '3px solid #c4c0f0',
        borderRadius: 10,
        padding:      '8px 10px',
        marginBottom: 6,
        cursor:       'grab',
        touchAction:  'none',
        userSelect:   'none',
        fontSize:     11,
        color:        '#6b67b0',
        fontWeight:   600,
        lineHeight:   1.4,
        boxShadow:    '0 1px 3px rgba(40,44,55,.07)',
        transition:   'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(40,44,55,.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 3px rgba(40,44,55,.07)' }}
    >
      {name}
      <div style={{ fontSize: 9, color: '#9a96cc', marginTop: 2 }}>Macros coming soon</div>
    </div>
  )
}

// ── IngredientDropRow (ingredient row in the board) ───────────────────────
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
            <div style={{ fontSize: 10, color: '#9a96cc', marginTop: 4, fontStyle: 'italic' }}>
              Macros coming soon
            </div>
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

// ── MacroPanel ────────────────────────────────────────────────────────────
function MacroPanel({ totals, target, setTarget, saved, onAutoFit, onSave }) {
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

      <div style={{ ...card, padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: C.ink }}>Saved meals</div>
        {saved.length === 0
          ? <div style={{ fontSize: 12, color: C.sub, textAlign: "center", padding: "12px 0" }}>No saved meals yet</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {saved.map((m, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#f3f4f7", border: `1px solid ${C.line}`,
                  borderRadius: 12, padding: "9px 12px",
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: C.sub }}>{m.count} {m.count === 1 ? "ingredient" : "ingredients"}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>
                    {m.kcal}<small style={{ color: "#9aa0ab", fontWeight: 400 }}> kcal</small>
                  </span>
                </div>
              ))}
            </div>
          )}
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

// ── Main component ────────────────────────────────────────────────────────
// recipes / onRecipeAdded kept in signature so page.jsx needs no changes
export default function MealBuilderTab({ recipes, ingredients, onRecipeAdded }) {
  const rowIdRef = useRef(0)

  // Board rows: [{ rowId, ingId, name?, grams }]
  // ingId is null for placeholder (dressing/sauce) items
  const [rows,      setRows]      = useState([])
  const [mealName,  setMealName]  = useState("My meal")
  const [target,    setTarget]    = useState({ kcal: 700, protein: 55 })
  const [saved,     setSaved]     = useState([])
  const [ingSearch, setIngSearch] = useState('')
  const [dragName,  setDragName]  = useState(null)

  // Usage counts — persisted to localStorage as { [ingId]: count }
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

  // Column data — sorted by usage desc, then alphabetical within equal counts
  const colData = useMemo(() =>
    COLS.map(col => ({
      ...col,
      items: col.placeholder
        ? []
        : ingredients
            .filter(col.filter)
            .slice()
            .sort((a, b) => {
              const ca = usage[a.id] || 0
              const cb = usage[b.id] || 0
              if (cb !== ca) return cb - ca
              return (a.name || '').localeCompare(b.name || '')
            }),
    })),
  [ingredients, usage])

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

  // Running meal totals (placeholder rows contribute 0 — macros not yet built)
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

  // Add an ingredient or placeholder to the board
  const addItem = useCallback((item) => {
    rowIdRef.current += 1
    if (item.id === null) {
      // Placeholder dressing/sauce — no ingId, name stored directly
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

  // Pointer drag: ingredient/placeholder tab → board drop zone (click also adds)
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
    setSaved(prev => [{
      name:  mealName || "Untitled meal",
      kcal:  totals.kcal,
      count: rows.length,
    }, ...prev].slice(0, 5))
  }

  // Responsive breakpoint
  const [narrow, setNarrow] = useState(typeof window !== "undefined" ? window.innerWidth < 1100 : false)
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 1100)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const gridStyle = narrow
    ? { display: "flex", flexDirection: "column", gap: 16 }
    : {
        display: "grid",
        gridTemplateColumns: "2fr 3fr",
        gap: 16,
        alignItems: "start",
      }

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
        .mb-ing-col::-webkit-scrollbar       { width: 4px; }
        .mb-ing-col::-webkit-scrollbar-track { background: transparent; }
        .mb-ing-col::-webkit-scrollbar-thumb { background: #d4d7df; border-radius: 4px; }
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
                    Click or drag ingredients from the columns
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
              saved={saved}
              onAutoFit={autoFit}
              onSave={saveMeal}
            />
            {Object.keys(usage).length > 0 && (
              <button
                onClick={resetUsage}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: C.sub, padding: '4px 0',
                  textDecoration: 'underline', alignSelf: 'flex-start',
                }}
              >
                Reset favourites
              </button>
            )}
          </div>

          {/* ── RIGHT: 5-column ingredient board ── */}
          <section style={{ ...cardBase, padding: 16, display: "flex", flexDirection: "column" }}>
            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${C.line}`, borderRadius: 12,
              padding: '8px 12px', background: '#f3f4f7', marginBottom: 12,
            }}>
              <span style={{ fontSize: 14, color: C.sub, flexShrink: 0 }}>🔍</span>
              <input
                value={ingSearch}
                onChange={e => setIngSearch(e.target.value)}
                placeholder="Search ingredients across all columns…"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: C.ink, outline: 'none' }}
              />
              {ingSearch && (
                <button
                  onClick={() => setIngSearch('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.sub, fontSize: 18, lineHeight: 1, padding: 0 }}
                >×</button>
              )}
            </div>

            {/* 5 ingredient columns — min 120px each so names don't wrap */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: narrow ? '1fr 1fr' : 'minmax(120px,1.3fr) repeat(4, minmax(120px,1fr))',
              gap: 10,
              alignItems: 'start',
            }}>
              {colData.map(col => (
                <div key={col.id}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, color: col.accent,
                    textTransform: 'uppercase', letterSpacing: '.08em',
                    marginBottom: 8, lineHeight: 1.35, padding: '0 2px',
                  }}>
                    {col.label}
                  </div>
                  <div className="mb-ing-col" style={{ maxHeight: 72 + 'vh', overflowY: 'auto', paddingRight: 2 }}>
                    {col.placeholder
                      ? PLACEHOLDER_TABS.map((name, i) => (
                          <PlaceholderTab
                            key={i}
                            name={name}
                            onPointerDown={e => {
                              e.preventDefault()
                              dragRef.current = {
                                item: { id: null, name },
                                x0: e.clientX, y0: e.clientY,
                                el: e.currentTarget, active: false,
                              }
                            }}
                          />
                        ))
                      : col.items.map(ing => (
                          <IngredientTab
                            key={ing.id}
                            ing={ing}
                            col={col}
                            isMatch={matchIds ? matchIds.has(ing.id) : true}
                            hasSearch={!!ingSearch}
                            usageCount={usage[ing.id] || 0}
                            onPointerDown={e => {
                              if (matchIds && !matchIds.has(ing.id)) return
                              e.preventDefault()
                              dragRef.current = {
                                item: ing,
                                x0: e.clientX, y0: e.clientY,
                                el: e.currentTarget, active: false,
                              }
                            }}
                          />
                        ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <DragGhost name={dragName} ghostRef={ghostRef} />
    </div>
  )
}
