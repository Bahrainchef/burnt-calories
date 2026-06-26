'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"

// ── Palette (brand-adapted from handoff) ──────────────────────────────────
const C = {
  bg:        "#eef0f4",
  surface:   "#ffffff",
  row:       "#fafbfc",
  line:      "#e6e8ee",
  ink:       "#2b303a",
  sub:       "#7c8490",
  primary:   "#2D5A27",   // forest green — ring, chips, sliders, active states
  cta:       "#E8621A",   // flame orange — Auto-fit button only
  protein:   "#36cf7c",
  carbs:     "#f7709f",
  fat:       "#ff8463",
  fiber:     "#0bb3a6",
  dark:      "#2b303a",
  darkTrack: "#3a414e",
  darkTile:  "#353c48",
}

const CAT_CHIP = {
  Breakfast: { tint: "#fff3dc", dot: "#C47C0A" },
  Lunch:     { tint: "#eaf3e6", dot: "#2D5A27" },
  Dinner:    { tint: "#fdeee6", dot: "#E8621A" },
  Snack:     { tint: "#eeedfe", dot: "#7F77DD" },
}
const getChip = (cat) => CAT_CHIP[cat] || { tint: "#f0f0f0", dot: "#888" }

const CATS = ["All", "Breakfast", "Lunch", "Dinner", "Snack"]
const CIRC  = 2 * Math.PI * 54  // r=54 calorie ring
const TILT  = 11                 // 3D tilt degrees

// ── Helpers ───────────────────────────────────────────────────────────────
const parseArr = (f) => {
  if (Array.isArray(f)) return f
  if (typeof f === "string") { try { return JSON.parse(f) } catch { return [] } }
  return []
}

function ingMacros(ing, amt) {
  if (!ing) return { cal: 0, p: 0, c: 0, f: 0, fi: 0 }
  const r = amt / (ing.ref || 100)
  return { cal: ing.cal * r, p: ing.p * r, c: ing.c * r, f: ing.f * r, fi: (ing.fi || 0) * r }
}

function recipeServingWeight(recipe) {
  const ings = parseArr(recipe.ings)
  const total = ings.reduce((s, ri) => s + (ri.amt || 0), 0)
  return total / (recipe.serves || 1)
}

function recipePerServe(recipe, ingredients) {
  let cal = 0, p = 0, c = 0, f = 0, fi = 0
  parseArr(recipe.ings).forEach(ri => {
    const ing = ingredients.find(i => i.id === ri.id)
    if (!ing) return
    const r = (ri.amt / (recipe.serves || 1)) / (ing.ref || 100)
    cal += ing.cal * r; p += ing.p * r; c += ing.c * r
    f += ing.f * r;     fi += (ing.fi || 0) * r
  })
  return { cal, p, c, f, fi }
}

function scaleByGrams(recipe, grams, ingredients) {
  const sw = recipeServingWeight(recipe)
  if (!sw) return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  const ps = recipePerServe(recipe, ingredients)
  const k  = grams / sw
  return {
    kcal:    Math.round(ps.cal * k),
    protein: Math.round(ps.p   * k),
    carbs:   Math.round(ps.c   * k),
    fat:     Math.round(ps.f   * k),
    fiber:   Math.round(ps.fi  * k),
  }
}

// ── DragGhost ─────────────────────────────────────────────────────────────
function DragGhost({ drag, ghostRef }) {
  return (
    <div ref={ghostRef} style={{
      position: "fixed", left: 0, top: 0, zIndex: 60,
      pointerEvents: "none",
      opacity: drag ? 1 : 0,
      transition: "opacity .12s",
      transform: "translate(-999px,-999px)",
    }}>
      {drag && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, padding: "10px 15px",
          boxShadow: "0 24px 46px -16px rgba(40,44,55,.5)",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: drag.tint,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: drag.photo ? 0 : 18, overflow: "hidden",
          }}>
            {drag.photo
              ? <img src={drag.photo} alt="" style={{ width: 34, height: 34, objectFit: "cover" }} />
              : drag.emoji}
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{drag.name}</span>
        </div>
      )}
    </div>
  )
}

// ── PantryCard ────────────────────────────────────────────────────────────
function PantryCard({ recipe, onPointerDown }) {
  const chip = getChip(recipe.cat)
  const hasPhoto = !!recipe.photo_url

  const tilt = (e) => {
    const c = e.currentTarget, r = c.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top)  / r.height - 0.5
    c.style.transition  = "transform .06s"
    c.style.transform   = `perspective(700px) rotateY(${px*TILT}deg) rotateX(${-py*TILT}deg) translateY(-4px) scale(1.02)`
    c.style.boxShadow   = "0 24px 42px -22px rgba(40,44,55,.42)"
  }
  const untilt = (e) => {
    const c = e.currentTarget
    c.style.transition  = "transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s"
    c.style.transform   = "perspective(700px) rotateY(0) rotateX(0) translateY(0) scale(1)"
    c.style.boxShadow   = "0 1px 2px rgba(40,44,55,.05)"
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onMouseMove={tilt}
      onMouseLeave={untilt}
      style={{
        background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16,
        padding: 12, cursor: "grab",
        touchAction: "none", userSelect: "none",
        boxShadow: "0 1px 2px rgba(40,44,55,.05)",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: chip.tint,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 10, overflow: "hidden",
      }}>
        {hasPhoto
          ? <img src={recipe.photo_url} alt="" style={{ width: 42, height: 42, objectFit: "cover" }} />
          : <span style={{ fontSize: 22 }}>{recipe.emoji}</span>}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.25, color: C.ink }}>{recipe.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: chip.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: C.sub }}>{recipe.cat}</span>
      </div>
    </div>
  )
}

// ── BoardRow ──────────────────────────────────────────────────────────────
function BoardRow({ row, onGramsChange, onRemove, ingredients }) {
  const chip = getChip(row.recipe.cat)
  const hasPhoto = !!row.recipe.photo_url
  // benefits: from the first ingredient of the recipe that has benefits
  const benefit = useMemo(() => {
    const ings = parseArr(row.recipe.ings)
    for (const ri of ings) {
      const ing = ingredients.find(i => i.id === ri.id)
      if (ing?.benefits?.[0]) return ing.benefits[0]
    }
    return null
  }, [row.recipe, ingredients])

  return (
    <div style={{
      background: C.row, border: `1px solid ${C.line}`,
      borderRadius: 16, padding: "12px 14px",
      animation: "mbRowIn .35s ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: chip.tint,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
        }}>
          {hasPhoto
            ? <img src={row.recipe.photo_url} alt="" style={{ width: 38, height: 38, objectFit: "cover" }} />
            : <span style={{ fontSize: 20 }}>{row.recipe.emoji}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{row.recipe.name}</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: C.ink, flexShrink: 0, marginLeft: 8 }}>
              {row.kcal} <small style={{ color: "#9aa0ab", fontWeight: 400 }}>kcal</small>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7 }}>
            <input
              type="range" min={10} max={400} step={5}
              value={row.grams}
              onChange={e => onGramsChange(row.uid, +e.target.value)}
              style={{ flex: 1, accentColor: C.primary }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3f49", width: 50, textAlign: "right" }}>
              {row.grams} g
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: C.sub }}>
            <span><b style={{ color: C.protein }}>P</b> {row.protein}g</span>
            <span><b style={{ color: C.carbs }}>C</b> {row.carbs}g</span>
            <span><b style={{ color: C.fat }}>F</b> {row.fat}g</span>
            <span><b style={{ color: C.fiber }}>Fb</b> {row.fiber}g</span>
          </div>
          {benefit && (
            <div style={{ fontSize: 10, color: C.sub, marginTop: 4, fontStyle: "italic" }}>
              {benefit}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(row.uid)}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 78 }}>
      {/* Totals card */}
      <div style={{ background: C.dark, color: "#fff", borderRadius: 24, padding: 20 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#c7ccd6" }}>Meal totals</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          {/* Calorie ring */}
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

      {/* Targets card */}
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

      {/* Saved meals */}
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
                    <div style={{ fontSize: 11, color: C.sub }}>{m.count} {m.count === 1 ? "recipe" : "recipes"}</div>
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

// ── CustomBuilder (Step 4 — ingredient → recipe) ──────────────────────────
function CustomBuilder({ ingredients, onSaveAsRecipe, onCancel }) {
  const [name,    setName]    = useState("Custom recipe")
  const [search,  setSearch]  = useState("")
  const [items,   setItems]   = useState([])   // [{id, amt}]
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState("")
  const [saved,   setSaved]   = useState(false)

  const dropRef   = useRef(null)
  const ghostRef  = useRef(null)
  const dragRef   = useRef(null)
  const [dragState, setDragState] = useState(null)

  const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(pointer:coarse)").matches

  const filtered = useMemo(() => {
    if (!search) return ingredients.slice(0, 60)
    const q = search.toLowerCase()
    return ingredients.filter(i =>
      (i.name || "").toLowerCase().includes(q) ||
      (i.sub  || "").toLowerCase().includes(q) ||
      (i.cat  || "").toLowerCase().includes(q)
    ).slice(0, 60)
  }, [search, ingredients])

  const totals = useMemo(() => {
    let cal=0, p=0, c=0, f=0, fi=0
    items.forEach(it => {
      const ing = ingredients.find(i => i.id === it.id)
      const m = ingMacros(ing, it.amt)
      cal+=m.cal; p+=m.p; c+=m.c; f+=m.f; fi+=m.fi
    })
    return { cal: Math.round(cal), p: Math.round(p), c: Math.round(c), f: Math.round(f), fi: Math.round(fi) }
  }, [items, ingredients])

  const addIngredient = useCallback((ing) => {
    setItems(prev => {
      if (prev.find(x => x.id === ing.id)) return prev
      return [...prev, { id: ing.id, amt: ing.ref || 100 }]
    })
  }, [])

  // Pointer drag for ingredient → custom recipe drop zone
  useEffect(() => {
    const overDrop = (e) => {
      const el = dropRef.current; if (!el) return false
      const r = el.getBoundingClientRect()
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    }
    const setHot = (on) => {
      const el = dropRef.current; if (!el) return
      el.style.boxShadow = on ? `inset 0 0 0 2px ${C.primary}` : ""
      el.style.background = on ? "linear-gradient(180deg,#eaf3e6,#ffffff)" : ""
    }
    const onMove = (e) => {
      const d = dragRef.current; if (!d) return
      if (!d.active) {
        if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return
        d.active = true
        setDragState({ name: d.ing.name })
        if (d.el) d.el.style.opacity = "0.35"
      }
      if (ghostRef.current)
        ghostRef.current.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%) rotate(-4deg)`
      setHot(overDrop(e))
    }
    const onUp = (e) => {
      const d = dragRef.current; if (!d) return
      if (d.active) {
        if (d.el) d.el.style.opacity = ""
        if (overDrop(e)) addIngredient(d.ing)
      } else {
        // Click / tap without movement — always add
        addIngredient(d.ing)
      }
      setHot(false)
      dragRef.current = null
      setDragState(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup",   onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup",   onUp)
    }
  }, [addIngredient])

  async function handleSave() {
    if (!items.length) { setErr("Add at least one ingredient."); return }
    setSaving(true); setErr("")
    const recipe = {
      name: name.trim() || "Custom recipe",
      cat: "Lunch", emoji: "🥘",
      ings: items, serves: 1,
      desc: "Custom recipe built in the meal builder.",
      goal: [], tags: ["Custom"], method: [],
      prep: 0, cook: 0,
      custom: true,
    }
    try {
      const { data, error } = await supabase.from("recipes").insert(recipe).select().single()
      if (error) throw error
      setSaved(true)
      if (onSaveAsRecipe) onSaveAsRecipe(data)
      setTimeout(() => { setSaved(false); onCancel() }, 1800)
    } catch (e) {
      setErr("Save failed: " + (e.message || "unknown"))
    } finally {
      setSaving(false)
    }
  }

  const ingRow = (ing) => (
    <div
      key={ing.id}
      onPointerDown={e => {
        e.preventDefault()
        dragRef.current = { id: ing.id, ing, x0: e.clientX, y0: e.clientY, el: e.currentTarget, active: false }
      }}
      style={{
        padding: "8px 12px", borderBottom: `1px solid ${C.line}`,
        cursor: "grab",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, touchAction: "none", userSelect: "none",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#f3f4f7"}
      onMouseLeave={e => e.currentTarget.style.background = ""}
    >
      <div>
        <span style={{ fontWeight: 600, color: C.ink }}>{ing.name}</span>
        <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>{ing.cat}</span>
      </div>
      <span style={{ fontSize: 10, color: C.sub }}>{ing.cal} kcal/{ing.ref}g</span>
    </div>
  )

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Ingredient library */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>Ingredient library</div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search ingredients…"
          style={{
            width: "100%", boxSizing: "border-box",
            border: `1px solid ${C.line}`, background: "#f3f4f7",
            borderRadius: 10, padding: "8px 11px", fontSize: 12, marginBottom: 8,
          }}
        />
        <div style={{
          border: `1px solid ${C.line}`, borderRadius: 10, maxHeight: 340, overflowY: "auto",
          background: C.surface,
        }}>
          {filtered.map(ingRow)}
        </div>
        <div style={{ fontSize: 10, color: C.sub, marginTop: 6 }}>Click or drag ingredients into the recipe →</div>
      </div>

      {/* Custom recipe drop zone / editor */}
      <div>
        <input
          value={name} onChange={e => setName(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "8px 11px", fontSize: 14, fontWeight: 700,
            color: C.ink, marginBottom: 10,
          }}
        />
        <div
          ref={dropRef}
          style={{
            minHeight: 200, border: `2px dashed #d4d7df`, borderRadius: 14,
            background: C.surface, transition: "background .18s,box-shadow .18s",
            padding: 10,
          }}
        >
          {items.length === 0 ? (
            <div style={{
              height: 160, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: C.sub, gap: 6,
            }}>
              <span style={{ fontSize: 28 }}>↓</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Click or drop ingredients here</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(it => {
                const ing = ingredients.find(i => i.id === it.id)
                if (!ing) return null
                const m = ingMacros(ing, it.amt)
                return (
                  <div key={it.id} style={{
                    background: C.row, border: `1px solid ${C.line}`,
                    borderRadius: 10, padding: "8px 10px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{ing.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: C.primary }}>{Math.round(m.cal)} kcal</span>
                        <button
                          onClick={() => setItems(prev => prev.filter(x => x.id !== it.id))}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#9aa0ab", fontSize: 14 }}
                        >×</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="range" min={5} max={500} step={5} value={it.amt}
                        onChange={e => setItems(prev => prev.map(x => x.id === it.id ? { ...x, amt: +e.target.value } : x))}
                        style={{ flex: 1, accentColor: C.primary }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, width: 40, textAlign: "right" }}>{it.amt}g</span>
                    </div>
                    {ing.benefits?.[0] && (
                      <div style={{ fontSize: 10, color: C.sub, fontStyle: "italic", marginTop: 2 }}>{ing.benefits[0]}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Live totals bar */}
        {items.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5,1fr)", textAlign: "center",
            marginTop: 10, padding: "8px 0", borderTop: `1px solid ${C.line}`,
          }}>
            {[["kcal", totals.cal, C.primary], ["P", totals.p+"g", "#36cf7c"], ["C", totals.c+"g", "#f7709f"], ["F", totals.f+"g", "#ff8463"], ["Fb", totals.fi+"g", C.sub]].map(([l, v, col]) => (
              <div key={l}>
                <div style={{ fontSize: 14, fontWeight: 700, color: col }}>{v}</div>
                <div style={{ fontSize: 9, color: C.sub, textTransform: "uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {err && <div style={{ fontSize: 12, color: "#E8621A", marginTop: 6 }}>{err}</div>}
        {saved && <div style={{ fontSize: 12, color: C.primary, marginTop: 6, fontWeight: 600 }}>Saved! Recipe added to pantry.</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleSave} disabled={saving || items.length === 0} style={{
            flex: 1, background: C.primary, color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 13,
            cursor: items.length ? "pointer" : "not-allowed",
            opacity: items.length ? 1 : 0.5,
          }}>
            {saving ? "Saving…" : "Save as recipe"}
          </button>
          <button onClick={onCancel} style={{
            flex: 1, background: C.surface, color: C.sub,
            border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "10px 0", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            Cancel
          </button>
        </div>
      </div>

      {/* Drag ghost for ingredient drag */}
      <div ref={ghostRef} style={{
        position: "fixed", left: 0, top: 0, zIndex: 70, pointerEvents: "none",
        opacity: dragState ? 1 : 0, transition: "opacity .12s",
        transform: "translate(-999px,-999px)",
      }}>
        {dragState && (
          <div style={{
            background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "8px 12px", fontSize: 12, fontWeight: 700, color: C.ink,
            boxShadow: "0 12px 30px -10px rgba(40,44,55,.4)",
          }}>
            {dragState.name}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function MealBuilderTab({ recipes, ingredients, onRecipeAdded }) {
  const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(pointer:coarse)").matches

  // Board state
  const [mealName, setMealName] = useState("My meal")
  const [meal,     setMeal]     = useState([])  // [{uid, recipeId, grams}]
  const [target,   setTarget]   = useState({ kcal: 700, protein: 55 })
  const [saved,    setSaved]    = useState([])

  // Pantry state
  const [cat,      setCat]      = useState("All")
  const [search,   setSearch]   = useState("")

  // Mode: "pantry" = drag recipes to board | "custom" = build custom recipe from ingredients
  const [mode, setMode] = useState("pantry")

  // Drag state (pantry→board)
  const [drag,  setDrag]  = useState(null)
  const uidRef    = useRef(0)
  const dragRef   = useRef(null)
  const ghostRef  = useRef(null)
  const dropRef   = useRef(null)

  // Recipe lookup map
  const byId = useMemo(
    () => Object.fromEntries(recipes.map(r => [r.id, r])),
    [recipes]
  )

  // Filtered pantry list
  const pantryList = useMemo(() => {
    return recipes.filter(r =>
      (cat === "All" || r.cat === cat) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase()))
    )
  }, [recipes, cat, search])

  // Board rows with scaled macros
  const rows = useMemo(() => meal.map(m => {
    const recipe = byId[m.recipeId]
    if (!recipe) return null
    const macros = scaleByGrams(recipe, m.grams, ingredients)
    return { ...m, recipe, ...macros }
  }).filter(Boolean), [meal, byId, ingredients])

  // Plate totals
  const totals = useMemo(() => rows.reduce(
    (a, r) => ({
      kcal:    a.kcal    + r.kcal,
      protein: a.protein + r.protein,
      carbs:   a.carbs   + r.carbs,
      fat:     a.fat     + r.fat,
      fiber:   a.fiber   + r.fiber,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  ), [rows])

  // Pointer-based drag (pantry → board) + click-to-add fallback
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
    const addToMeal = (id) => {
      const r = byId[id]; if (!r) return
      uidRef.current += 1
      const sw = recipeServingWeight(r)
      const defaultGrams = sw > 0 ? Math.round(sw / 5) * 5 : 150
      setMeal(m => [...m, { uid: uidRef.current, recipeId: id, grams: Math.max(50, Math.min(400, defaultGrams)) }])
    }
    const onMove = (e) => {
      const d = dragRef.current; if (!d) return
      if (!d.active) {
        if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return
        d.active = true
        const r = byId[d.id]
        if (d.el) d.el.style.opacity = "0.35"
        const chip = getChip(r.cat)
        setDrag({ name: r.name, emoji: r.emoji, photo: r.photo_url || null, tint: chip.tint })
      }
      if (ghostRef.current)
        ghostRef.current.style.transform =
          `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%) rotate(-4deg)`
      setHot(overDrop(e))
    }
    const onUp = (e) => {
      const d = dragRef.current; if (!d) return
      if (d.active) {
        // Real drag — add only if released over the drop zone
        if (d.el) d.el.style.opacity = ""
        if (overDrop(e)) addToMeal(d.id)
      } else {
        // Click / tap without movement — always add
        addToMeal(d.id)
      }
      setHot(false)
      dragRef.current = null
      setDrag(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup",   onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup",   onUp)
    }
  }, [byId])

  // onPointerDown sets up drag tracking for ALL devices; click falls through onUp
  const onCardDown = (e, id) => {
    e.preventDefault()
    dragRef.current = { id, x0: e.clientX, y0: e.clientY, el: e.currentTarget, active: false }
  }

  const setGrams  = (uid, grams) => setMeal(m => m.map(x => x.uid === uid ? { ...x, grams } : x))
  const removeRow = (uid)        => setMeal(m => m.filter(x => x.uid !== uid))

  const autoFit = () => {
    if (!totals.kcal) return
    const factor = target.kcal / totals.kcal
    setMeal(m => m.map(x => ({
      ...x, grams: Math.max(10, Math.min(400, Math.round(x.grams * factor / 5) * 5))
    })))
  }

  const saveMeal = () => {
    if (!meal.length) return
    setSaved(prev => [{
      name: mealName || "Untitled meal",
      kcal: totals.kcal,
      count: meal.length,
    }, ...prev].slice(0, 5))
  }

  // Responsive: at < 900px collapse to single column
  const [narrow, setNarrow] = useState(typeof window !== "undefined" ? window.innerWidth < 900 : false)
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const gridStyle = narrow
    ? { display: "flex", flexDirection: "column", gap: 16 }
    : {
        display: "grid",
        gridTemplateColumns: "clamp(240px,22vw,300px) minmax(360px,1fr) clamp(260px,23vw,320px)",
        gap: 16,
        alignItems: "start",
      }

  const cardBase = {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 22,
    boxShadow: "0 1px 2px rgba(40,44,55,.04),0 18px 40px -28px rgba(40,44,55,.18)",
  }

  if (mode === "custom") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", padding: "0 0 40px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setMode("pantry")} style={{
              border: `1px solid ${C.line}`, background: C.surface, borderRadius: 10,
              padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.ink,
            }}>
              ← Back to Meal Builder
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Build a custom recipe from ingredients</span>
          </div>
          <div style={{ ...cardBase, padding: 20 }}>
            <CustomBuilder
              ingredients={ingredients}
              onSaveAsRecipe={(newRecipe) => { if (onRecipeAdded) onRecipeAdded(newRecipe) }}
              onCancel={() => setMode("pantry")}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "0 0 40px" }}>
      <style>{`
        @keyframes mbRowIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={gridStyle}>

          {/* ── Column A: Pantry ── */}
          <section style={{ ...cardBase, padding: 16, maxHeight: narrow ? "none" : 780, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink }}>Pantry</h2>
              {!isTouchDevice && <span style={{ fontSize: 11, color: C.sub }}>drag a recipe →</span>}
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes…"
              style={{
                border: `1px solid ${C.line}`, background: "#f3f4f7",
                borderRadius: 12, padding: "9px 12px", fontSize: 13,
                marginBottom: 10, width: "100%", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{
                  border: `1px solid ${cat === c ? C.primary : C.line}`,
                  background: cat === c ? C.primary : C.surface,
                  color: cat === c ? "#fff" : "#3a3f49",
                  borderRadius: 999, padding: "5px 12px", fontSize: 11,
                  fontWeight: 600, cursor: "pointer",
                }}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{
              flex: 1, overflowY: "auto",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9,
            }}>
              {pantryList.map(r => (
                <PantryCard
                  key={r.id}
                  recipe={r}
                  onPointerDown={e => onCardDown(e, r.id)}
                />
              ))}
              {pantryList.length === 0 && (
                <div style={{ gridColumn: "1/-1", padding: "24px 0", textAlign: "center", color: C.sub, fontSize: 12 }}>
                  No recipes match
                </div>
              )}
            </div>
            <button onClick={() => setMode("custom")} style={{
              marginTop: 12, width: "100%", border: `1px solid ${C.line}`,
              background: C.surface, borderRadius: 12, padding: "9px 0",
              fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.ink,
            }}>
              + Build custom recipe from ingredients
            </button>
          </section>

          {/* ── Column B: Board ── */}
          <section>
            <div
              ref={dropRef}
              style={{
                ...cardBase, borderRadius: 24, padding: 18,
                minHeight: 500,
                transition: "transform .18s,box-shadow .18s,background .18s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <input
                  value={mealName} onChange={e => setMealName(e.target.value)}
                  style={{
                    border: "none", background: "transparent",
                    fontWeight: 800, fontSize: 22, flex: 1, minWidth: 0,
                    color: C.ink, letterSpacing: "-.01em",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: C.sub }}>
                    {meal.length} {meal.length === 1 ? "recipe" : "recipes"}
                  </span>
                  {meal.length > 0 && (
                    <button onClick={() => setMeal([])} style={{
                      fontSize: 11, padding: "4px 10px", cursor: "pointer",
                      border: `1px solid ${C.line}`, borderRadius: 8,
                      background: C.surface, color: C.sub,
                    }}>Clear</button>
                  )}
                </div>
              </div>
              {rows.length === 0 ? (
                <div style={{
                  border: "2px dashed #d4d7df", borderRadius: 18, minHeight: 360,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 10, color: "#9aa0ab",
                }}>
                  <span style={{ fontSize: 38 }}>↓</span>
                  <span style={{ fontWeight: 700, fontSize: 17, color: "#6b7280" }}>
                    Click or drag recipes from the Pantry
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {rows.map(row => (
                    <BoardRow
                      key={row.uid}
                      row={row}
                      onGramsChange={setGrams}
                      onRemove={removeRow}
                      ingredients={ingredients}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Column C: Macros (sticky) ── */}
          <aside>
            <MacroPanel
              totals={totals}
              target={target}
              setTarget={setTarget}
              saved={saved}
              onAutoFit={autoFit}
              onSave={saveMeal}
            />
          </aside>
        </div>
      </div>

      <DragGhost drag={drag} ghostRef={ghostRef} />
    </div>
  )
}
