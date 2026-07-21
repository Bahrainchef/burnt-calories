'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:        "#F4F5F7",
  surface:   "#ffffff",
  line:      "#e6e8ee",
  ink:       "#2b303a",
  sub:       "#7c8490",
  cta:       "#E8621A",
  dark:      "#2b303a",
  darkTrack: "#3a414e",
  darkTile:  "#353c48",
}

// ── Column definitions (cat values confirmed by SELECT DISTINCT) ───────────
const COLS = [
  {
    id:          'protein',
    label:       'Proteins',
    accent:      '#C4530A',
    accentLight: '#FFF0E8',
    filter:      (ing) => ing.cat === 'Protein',
    wider:       true,
  },
  {
    id:          'carbs',
    label:       'Carbs & Starches',
    accent:      '#C47C0A',
    accentLight: '#FDF3DC',
    filter:      (ing) => ing.cat === 'Carbohydrate',
  },
  {
    id:          'vegetables',
    label:       'Vegetables',
    accent:      '#2D5A27',
    accentLight: '#EAF3E6',
    filter:      (ing) => ing.cat === 'Vegetable',
  },
  {
    id:          'fruits',
    label:       'Fruits',
    accent:      '#C0446A',
    accentLight: '#FDEEF4',
    filter:      (ing) => ing.cat === 'Fruit',
  },
  {
    id:          'dressings',
    label:       'Dressings · Sauces · Marinades · Pickles',
    accent:      '#7F77DD',
    accentLight: '#EEEDFE',
    filter:      null,
    placeholder: true,
  },
]

const PLACEHOLDER_TABS = [
  "Classic French Dressing 🔜",
  "Asian Sesame Dressing 🔜",
  "Balsamic Dressing 🔜",
  "Korean Dressing 🔜",
  "Mushroom Sauce 🔜",
  "Korean BBQ Sauce 🔜",
  "Classic Marinade 🔜",
  "Pickled Red Onion 🔜",
]

const RECIPE_CATS = ["Breakfast", "Lunch", "Dinner", "Snack"]

// ── Macro helper (same logic as MealBuilderTab.ingMacros) ──────────────────
function ingMacros(ing, amt) {
  if (!ing) return { cal: 0, p: 0, c: 0, f: 0 }
  const r = amt / (ing.ref || 100)
  return { cal: ing.cal * r, p: ing.p * r, c: ing.c * r, f: ing.f * r }
}

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, onClose, onViewRecipes }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 24, zIndex: 999,
      background: '#2b303a', color: '#fff', borderRadius: 16,
      padding: '14px 20px', fontSize: 13, fontWeight: 600,
      boxShadow: '0 16px 48px -12px rgba(40,44,55,.65)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'qrbToastIn .3s cubic-bezier(.2,.8,.2,1)',
      maxWidth: 360,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onViewRecipes && (
        <button
          onClick={onViewRecipes}
          style={{
            background: C.cta, color: '#fff', border: 'none',
            borderRadius: 8, padding: '5px 12px', fontSize: 11,
            fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >
          View →
        </button>
      )}
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: '#99a0ac',
        fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0,
      }}>×</button>
    </div>
  )
}

// ── IngredientTab ────────────────────────────────────────────────────────────
function IngredientTab({ ing, col, onPointerDown, isMatch, hasSearch }) {
  const m = ingMacros(ing, 100)
  const dimmed = hasSearch && !isMatch

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        background:   dimmed ? '#f7f8fa' : col.accentLight,
        borderLeft:   `3px solid ${dimmed ? '#d4d7df' : col.accent}`,
        borderRadius: 10,
        padding:      col.wider ? '10px 11px' : '8px 9px',
        cursor:       dimmed ? 'default' : 'grab',
        touchAction:  'none',
        userSelect:   'none',
        boxShadow:    '0 1px 3px rgba(40,44,55,.07)',
        opacity:      dimmed ? 0.3 : 1,
        transition:   'opacity .15s, transform .15s, box-shadow .15s',
        marginBottom: 6,
        pointerEvents: dimmed ? 'none' : 'auto',
      }}
      onMouseEnter={e => {
        if (dimmed) return
        e.currentTarget.style.transform  = 'scale(1.02)'
        e.currentTarget.style.boxShadow  = '0 4px 14px rgba(40,44,55,.14)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(40,44,55,.07)'
      }}
    >
      <div style={{ fontWeight: 700, fontSize: col.wider ? 13 : 12, color: C.ink, lineHeight: 1.3, marginBottom: 3 }}>
        {ing.name}
      </div>
      <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.4 }}>
        <span style={{ color: col.accent, fontWeight: 700 }}>{Math.round(m.cal)}</span>
        {' cal · '}
        <span style={{ color: '#36cf7c' }}>{Math.round(m.p)}P</span>
        {' · '}
        <span style={{ color: '#f7709f' }}>{Math.round(m.c)}C</span>
        {' · '}
        <span style={{ color: '#ff8463' }}>{Math.round(m.f)}F</span>
        {' /100g'}
      </div>
    </div>
  )
}

// ── DropRow ───────────────────────────────────────────────────────────────────
function DropRow({ row, ing, onGramsChange, onRemove }) {
  const m = ingMacros(ing, row.grams)

  const step = (delta) => {
    const next = Math.max(1, Math.round((row.grams + delta) / 5) * 5)
    onGramsChange(row.rowId, next)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px',
      borderBottom: `1px solid ${C.line}`,
      animation: 'qrbRowIn .28s ease',
    }}>
      {/* Name */}
      <div style={{ flex: '0 0 130px', minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 13, color: C.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {ing?.name || '?'}
        </div>
        <div style={{ fontSize: 10, color: C.sub }}>{ing?.cat}</div>
      </div>

      {/* Gram stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <button onClick={() => step(-5)} style={stepBtn}>−</button>
        <input
          type="number"
          value={row.grams}
          min={1}
          max={2000}
          onChange={e => onGramsChange(row.rowId, Math.max(1, +e.target.value || 1))}
          style={{
            width: 50, textAlign: 'center',
            border: `1px solid ${C.line}`, borderRadius: 7,
            padding: '3px 4px', fontSize: 12, fontWeight: 700,
            color: C.ink, background: C.surface, outline: 'none',
          }}
        />
        <button onClick={() => step(5)} style={stepBtn}>+</button>
        <span style={{ fontSize: 10, color: C.sub, marginLeft: 1 }}>g</span>
      </div>

      {/* Macros */}
      <div style={{ display: 'flex', gap: 8, fontSize: 11, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, color: C.ink, fontSize: 12 }}>
          {Math.round(m.cal)}<span style={{ fontWeight: 400, color: C.sub }}> cal</span>
        </span>
        <span><b style={{ color: '#36cf7c' }}>P</b> {Math.round(m.p)}g</span>
        <span><b style={{ color: '#f7709f' }}>C</b> {Math.round(m.c)}g</span>
        <span><b style={{ color: '#ff8463' }}>F</b> {Math.round(m.f)}g</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(row.rowId)}
        style={{
          border: 'none', background: '#eef0f3',
          width: 26, height: 26, borderRadius: 7,
          color: '#9aa0ab', cursor: 'pointer', fontSize: 17, lineHeight: 1,
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >×</button>
    </div>
  )
}

const stepBtn = {
  width: 22, height: 22, border: `1px solid #e6e8ee`,
  borderRadius: 6, background: '#ffffff', cursor: 'pointer',
  fontSize: 14, lineHeight: 1, color: '#7c8490',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0,
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function QuickRecipeBuilder({ ingredients = [], onSaved, onViewRecipes }) {
  const rowIdRef = useRef(0)

  // Drop zone rows: { rowId, ingId, grams }
  const [rows, setRows]           = useState([])
  const [search, setSearch]       = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  // Save form
  const [recipeName, setRecipeName] = useState('')
  const [serves, setServes]         = useState(1)
  const [prepTime, setPrepTime]     = useState(0)
  const [recCat, setRecCat]         = useState('Lunch')
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)
  const [saveErr, setSaveErr]       = useState('')

  // Drag
  const dropRef  = useRef(null)
  const ghostRef = useRef(null)
  const dragRef  = useRef(null)
  const [ghostIng, setGhostIng] = useState(null)

  // Responsive
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 960)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Column data — filter ingredients into each column
  const colData = useMemo(() =>
    COLS.map(col => ({
      ...col,
      items: col.placeholder ? [] : ingredients.filter(col.filter),
    })),
  [ingredients])

  // Search filter: which ingredient IDs match
  const matchIds = useMemo(() => {
    if (!search) return null
    const q = search.toLowerCase()
    const ids = new Set()
    ingredients.forEach(ing => {
      if (
        (ing.name || '').toLowerCase().includes(q) ||
        (ing.sub  || '').toLowerCase().includes(q)
      ) ids.add(ing.id)
    })
    return ids
  }, [search, ingredients])

  // Totals
  const totals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0
    rows.forEach(row => {
      const ing = ingredients.find(i => i.id === row.ingId)
      const m = ingMacros(ing, row.grams)
      cal += m.cal; p += m.p; c += m.c; f += m.f
    })
    return { cal: Math.round(cal), p: Math.round(p), c: Math.round(c), f: Math.round(f) }
  }, [rows, ingredients])

  const addIngredient = useCallback((ing) => {
    rowIdRef.current += 1
    setRows(prev => [...prev, { rowId: rowIdRef.current, ingId: ing.id, grams: ing.ref || 100 }])
  }, [])

  // Pointer drag: ingredient tab → drop zone
  useEffect(() => {
    const overDrop = (e) => {
      const el = dropRef.current; if (!el) return false
      const r = el.getBoundingClientRect()
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    }

    const onMove = (e) => {
      const d = dragRef.current; if (!d) return
      if (!d.active) {
        if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return
        d.active = true
        setGhostIng(d.ing)
        if (d.el) d.el.style.opacity = '0.35'
      }
      if (ghostRef.current)
        ghostRef.current.style.transform =
          `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-70%) rotate(-3deg)`
      setIsDragOver(overDrop(e))
    }

    const onUp = (e) => {
      const d = dragRef.current; if (!d) return
      if (d.active) {
        if (d.el) d.el.style.opacity = ''
        if (overDrop(e)) addIngredient(d.ing)
      } else {
        addIngredient(d.ing)
      }
      dragRef.current = null
      setGhostIng(null)
      setIsDragOver(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [addIngredient])

  const setGrams  = (rowId, grams) => setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, grams } : r))
  const removeRow = (rowId)        => setRows(prev => prev.filter(r => r.rowId !== rowId))

  async function handleSave() {
    if (!rows.length)        { setSaveErr('Add at least one ingredient.'); return }
    if (!recipeName.trim())  { setSaveErr('Enter a recipe name.'); return }
    setSaving(true); setSaveErr('')

    const payload = {
      name:      recipeName.trim(),
      cat:       recCat,
      serves:    serves || 1,
      prep:      prepTime || 0,
      cook:      0,
      emoji:     '🥘',
      desc:      '',
      ings:      rows.map(r => ({ id: r.ingId, amt: r.grams })),
      method:    [],
      tags:      ['Custom'],
      goal:      [],
      custom:    true,
      photo_url: null,
    }

    try {
      const { data, error } = await supabase.from('recipes').insert(payload).select().single()
      if (error) throw error
      setToast(`Recipe saved to ${recCat}`)
      if (onSaved) onSaved(data)
      setRows([])
      setRecipeName('')
      setServes(1)
      setPrepTime(0)
    } catch (e) {
      setSaveErr('Save failed: ' + (e.message || 'unknown'))
    } finally {
      setSaving(false)
    }
  }

  const canSave = rows.length > 0 && recipeName.trim()

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg }}>
      <style>{`
        @keyframes qrbRowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes qrbToastIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes qrbDrop {
          0%,100% { box-shadow: inset 0 0 0 2px #2D5A27; }
          50%      { box-shadow: inset 0 0 0 3px #2D5A27, 0 0 0 5px rgba(45,90,39,.12); }
        }
        .qrb-col::-webkit-scrollbar       { width: 4px; }
        .qrb-col::-webkit-scrollbar-track { background: transparent; }
        .qrb-col::-webkit-scrollbar-thumb { background: #d4d7df; border-radius: 4px; }
      `}</style>

      {/* ── Divider + Heading ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '36px 0 24px' }}>
          <div style={{ flex: 1, height: 1, background: C.line }} />
          <h2 style={{
            margin: 0, fontSize: 18, fontWeight: 800,
            color: C.ink, letterSpacing: '-.01em', flexShrink: 0,
          }}>
            ⚡ Quick Recipe Builder
          </h2>
          <div style={{ flex: 1, height: 1, background: C.line }} />
        </div>
      </div>

      {/* ── Two-panel grid ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 48px' }}>
        <div style={narrow
          ? { display: 'flex', flexDirection: 'column', gap: 16 }
          : { display: 'grid', gridTemplateColumns: '400px 1fr', gap: 22, alignItems: 'start' }
        }>

          {/* ══ LEFT: Drop zone + totals + save ══════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Drop zone card */}
            <div style={{
              background: C.surface, borderRadius: 20,
              border: `1px solid ${C.line}`,
              boxShadow: '0 1px 2px rgba(40,44,55,.04),0 14px 32px -20px rgba(40,44,55,.13)',
              overflow: 'hidden',
              transition: 'box-shadow .2s',
            }}>
              <div
                ref={dropRef}
                style={{
                  minHeight: rows.length === 0 ? 200 : 'auto',
                  transition: 'background .18s',
                  ...(isDragOver ? {
                    background: 'linear-gradient(180deg,#eaf3e6,#ffffff)',
                    animation: 'qrbDrop .7s ease infinite',
                  } : {}),
                }}
              >
                {rows.length === 0 ? (
                  <div style={{
                    margin: 12, height: 176,
                    border: '2px dashed #d4d7df', borderRadius: 14,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8, color: C.sub,
                    transition: 'border-color .18s',
                    ...(isDragOver ? { borderColor: '#2D5A27' } : {}),
                  }}>
                    <span style={{ fontSize: 36 }}>🍳</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#6b7280' }}>
                      Drop ingredients here to build your recipe
                    </span>
                    <span style={{ fontSize: 12, color: C.sub }}>
                      or tap any ingredient on the right
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px 8px',
                      fontSize: 10, fontWeight: 700, color: C.sub,
                      textTransform: 'uppercase', letterSpacing: '.06em',
                      borderBottom: `1px solid ${C.line}`,
                    }}>
                      <span style={{ flex: '0 0 130px' }}>Ingredient</span>
                      <span style={{ flex: '0 0 110px' }}>Amount</span>
                      <span style={{ flex: 1 }}>Cal · P · C · F</span>
                    </div>
                    {rows.map(row => {
                      const ing = ingredients.find(i => i.id === row.ingId)
                      return (
                        <DropRow
                          key={row.rowId}
                          row={row}
                          ing={ing}
                          onGramsChange={setGrams}
                          onRemove={removeRow}
                        />
                      )
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Total macro card */}
            {rows.length > 0 && (
              <div style={{ background: C.dark, color: '#fff', borderRadius: 18, padding: '16px 18px' }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#c7ccd6', marginBottom: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>Recipe totals</span>
                  <span style={{ fontWeight: 400, color: '#7c8490' }}>
                    {rows.length} ingredient{rows.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center', minWidth: 72 }}>
                    <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>
                      {totals.cal}
                    </div>
                    <div style={{ fontSize: 10, color: '#99a0ac', marginTop: 3 }}>kcal total</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 7 }}>
                    {[
                      ['Protein', totals.p, '#36cf7c'],
                      ['Carbs',   totals.c, '#f7709f'],
                      ['Fat',     totals.f, '#ff8463'],
                    ].map(([label, val, col]) => (
                      <div key={label} style={{
                        flex: 1, background: C.darkTile, borderRadius: 11, padding: '9px 8px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 10, color: '#99a0ac', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: col }}>
                          {val}<small style={{ fontSize: 10, color: '#99a0ac', fontWeight: 400 }}>g</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Macro split bar */}
                {totals.cal > 0 && (
                  <div style={{ height: 6, borderRadius: 3, background: C.darkTrack, overflow: 'hidden', display: 'flex' }}>
                    {(() => {
                      const total = (totals.p * 4) + (totals.c * 4) + (totals.f * 9) || 1
                      return [
                        [totals.p * 4, '#36cf7c'],
                        [totals.c * 4, '#f7709f'],
                        [totals.f * 9, '#ff8463'],
                      ].map(([kcal, col], i) => (
                        <div key={i} style={{
                          width: Math.round(kcal / total * 100) + '%',
                          background: col, height: '100%',
                          transition: 'width .3s',
                        }} />
                      ))
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Save section */}
            <div style={{
              background: C.surface, borderRadius: 18, padding: '16px 18px',
              border: `1px solid ${C.line}`,
              boxShadow: '0 1px 2px rgba(40,44,55,.04)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 14 }}>
                Save recipe
              </div>

              <input
                value={recipeName}
                onChange={e => setRecipeName(e.target.value)}
                placeholder="Recipe name…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `1px solid ${C.line}`, borderRadius: 10,
                  padding: '9px 12px', fontSize: 14, fontWeight: 700,
                  color: C.ink, background: C.surface, outline: 'none',
                  marginBottom: 10,
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Serves', type: 'number', value: serves,   min: 1,  onChange: e => setServes(Math.max(1, +e.target.value || 1)) },
                  { label: 'Prep (min)', type: 'number', value: prepTime, min: 0, onChange: e => setPrepTime(Math.max(0, +e.target.value || 0)) },
                ].map(({ label, type, value, min, onChange }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: C.sub, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {label}
                    </div>
                    <input
                      type={type} min={min} value={value} onChange={onChange}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        border: `1px solid ${C.line}`, borderRadius: 9,
                        padding: '7px 10px', fontSize: 13, color: C.ink,
                        background: C.surface, outline: 'none',
                      }}
                    />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 10, color: C.sub, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Category
                  </div>
                  <select
                    value={recCat}
                    onChange={e => setRecCat(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: `1px solid ${C.line}`, borderRadius: 9,
                      padding: '7px 10px', fontSize: 13, color: C.ink,
                      background: C.surface, cursor: 'pointer',
                    }}
                  >
                    {RECIPE_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {saveErr && (
                <div style={{ fontSize: 12, color: C.cta, marginBottom: 8 }}>{saveErr}</div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !canSave}
                style={{
                  width: '100%', background: C.cta, color: '#fff',
                  border: 'none', borderRadius: 12,
                  padding: '12px 0', fontWeight: 700, fontSize: 14,
                  cursor: canSave && !saving ? 'pointer' : 'not-allowed',
                  opacity: canSave && !saving ? 1 : 0.45,
                  boxShadow: canSave ? '0 10px 22px -10px rgba(232,98,26,.6)' : 'none',
                  transition: 'opacity .15s, box-shadow .15s',
                }}
              >
                {saving ? 'Saving…' : 'Save Recipe'}
              </button>
            </div>
          </div>

          {/* ══ RIGHT: 5 ingredient columns ══════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Search bar */}
            <div style={{
              background: C.surface, borderRadius: 14,
              border: `1px solid ${C.line}`,
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 1px 2px rgba(40,44,55,.04)',
            }}>
              <span style={{ fontSize: 16, color: C.sub, flexShrink: 0 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ingredients across all columns…"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 13, color: C.ink, outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: C.sub, fontSize: 20, lineHeight: 1, padding: 0,
                  }}
                >×</button>
              )}
            </div>

            {/* 5 columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr',
              gap: 10,
              alignItems: 'start',
              ...(narrow ? { gridTemplateColumns: '1fr 1fr', gap: 8 } : {}),
            }}>
              {colData.map(col => (
                <div key={col.id}>
                  {/* Column header */}
                  <div style={{
                    fontSize: 9, fontWeight: 800, color: col.accent,
                    textTransform: 'uppercase', letterSpacing: '.08em',
                    marginBottom: 8, lineHeight: 1.35,
                    padding: '0 2px',
                  }}>
                    {col.label}
                  </div>

                  {/* Scrollable column body */}
                  <div className="qrb-col" style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 2 }}>
                    {col.placeholder
                      ? PLACEHOLDER_TABS.map((name, i) => (
                          <div
                            key={i}
                            title="Coming soon — build this as a mini base recipe"
                            style={{
                              background: '#f5f4fc',
                              borderLeft: '3px solid #c4c0f0',
                              borderRadius: 10,
                              padding: '8px 10px',
                              marginBottom: 6,
                              cursor: 'not-allowed',
                              opacity: 0.6,
                              fontSize: 11,
                              color: '#9a96cc',
                              fontWeight: 600,
                              lineHeight: 1.4,
                            }}
                          >
                            {name}
                          </div>
                        ))
                      : col.items.map(ing => (
                          <IngredientTab
                            key={ing.id}
                            ing={ing}
                            col={col}
                            isMatch={matchIds ? matchIds.has(ing.id) : true}
                            hasSearch={!!search}
                            onPointerDown={e => {
                              if (matchIds && !matchIds.has(ing.id)) return
                              e.preventDefault()
                              dragRef.current = {
                                ing, x0: e.clientX, y0: e.clientY,
                                el: e.currentTarget, active: false,
                              }
                            }}
                          />
                        ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drag ghost */}
      <div
        ref={ghostRef}
        style={{
          position: 'fixed', left: 0, top: 0, zIndex: 80,
          pointerEvents: 'none',
          opacity: ghostIng ? 1 : 0,
          transition: 'opacity .12s',
          transform: 'translate(-999px,-999px)',
        }}
      >
        {ghostIng && (
          <div style={{
            background: C.surface, border: `1px solid ${C.line}`,
            borderRadius: 12, padding: '9px 14px',
            boxShadow: '0 16px 40px -12px rgba(40,44,55,.55)',
            fontSize: 12, fontWeight: 700, color: C.ink,
          }}>
            {ghostIng.name}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          onViewRecipes={onViewRecipes}
        />
      )}
    </div>
  )
}
