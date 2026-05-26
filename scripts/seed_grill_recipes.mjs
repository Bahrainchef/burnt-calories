/**
 * Seed 25 Bahrain-style grill platter recipes (ids 650–674).
 * Usage: node scripts/seed_grill_recipes.mjs
 */
import { createClient } from '@supabase/supabase-js'

const URL = 'https://lglubafgeurmqjuwmerw.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbHViYWZnZXVybXFqdXdtZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDE4MjQsImV4cCI6MjA5NTExNzgyNH0.34KqORNSjw-FKeNGc6QA3b27ajOxS82-tFX8RlNaVZI'

const db = createClient(URL, KEY, { auth: { persistSession: false } })

// Ingredient IDs (confirmed from BASE_ING):
// chicken breast=1, turkey mince lean=4, beef mince 5%=9, sirloin steak=6
// salmon=14, whole egg=20, white rice=32, brown rice=31, jasmine rice=34
// sweet potato=48, broccoli=65, mushrooms=77, spinach=57
// cherry tomatoes=69, zucchini=75, avocado=118, corn=90
// chickpeas=148, passata=152, sesame oil=121, olive oil=119
// wholegrain bread=51, sourdough=50, lavash=54
// capsicum=71, chilli=135, orange=116

const RECIPES = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────────
  {
    id: 650, name: 'Turkey & Egg Omelette Toastie', cat: 'Breakfast',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🍳',
    desc: 'Lean turkey mince and egg omelette with sautéed mushrooms on wholegrain toast. A high-protein Bahrain breakfast favourite — clean fuel to start the day.',
    ings: [{id:4,amt:100},{id:20,amt:120},{id:77,amt:80},{id:51,amt:38}],
    method: [
      'Brown turkey mince in a non-stick pan over medium heat 5 min. Season with salt and pepper.',
      'Whisk 2 eggs and pour over the turkey. Tilt pan to cover evenly.',
      'Add sliced mushrooms to one side. Fold omelette and cook 2 min more.',
      'Toast wholegrain bread until golden.',
      'Plate omelette on toast and serve immediately.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 651, name: 'Egg & Mushroom Wrap', cat: 'Breakfast',
    goal: ['fat_loss'], prep: 5, cook: 10, serves: 1, emoji: '🌯',
    desc: 'Fluffy scrambled eggs and sautéed mushrooms wrapped in warm lavash with fresh baby spinach. Light, clean, and ready in 10 minutes.',
    ings: [{id:20,amt:120},{id:77,amt:80},{id:54,amt:50},{id:57,amt:40}],
    method: [
      'Sauté sliced mushrooms in a dry pan 3 min until golden.',
      'Whisk 2 eggs, pour over mushrooms and scramble gently — remove while still moist.',
      'Warm lavash in a dry pan 30 sec each side.',
      'Layer spinach, scrambled eggs and mushrooms on lavash.',
      'Roll tight and slice in half. Serve warm.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 652, name: 'Jalapeño Veggie Omelette', cat: 'Breakfast',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 10, serves: 1, emoji: '🌶️',
    desc: 'Three-egg omelette with charred red capsicum, chilli heat and wholegrain toast. A spicy, veggie-packed breakfast that delivers over 20g protein.',
    ings: [{id:20,amt:180},{id:71,amt:80},{id:135,amt:5},{id:51,amt:38}],
    method: [
      'Char capsicum strips in a dry pan 3 min on high heat.',
      'Whisk 3 eggs with chilli powder, salt and pepper.',
      'Pour egg mix into pan, add capsicum to one half.',
      'Cook 2 min then fold. Slide onto plate.',
      'Serve with toasted wholegrain bread.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 653, name: 'Scrambled Egg & Mushroom Toast', cat: 'Breakfast',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 8, serves: 1, emoji: '🍳',
    desc: 'Soft scrambled eggs with golden mushrooms on toasted sourdough. Simple. Clean. The kind of breakfast that never gets old.',
    ings: [{id:20,amt:180},{id:77,amt:80},{id:50,amt:40}],
    method: [
      'Sauté mushrooms in a pan 3 min until golden. Set aside.',
      'Whisk 3 eggs with a pinch of salt.',
      'Scramble over low heat — stir slowly, remove while still glossy.',
      'Toast sourdough until crisp.',
      'Top toast with mushrooms then scrambled eggs.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },

  // ── FITNESS GRILL PLATTERS ──────────────────────────────────────────────────
  {
    id: 654, name: '150g Grilled Chicken & Steamed Rice', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🍗',
    desc: '150g grilled chicken breast and 150g steamed white rice — the Bahrain fitness standard. Simple, consistent, and exactly what the macros demand.',
    ings: [{id:1,amt:150},{id:32,amt:150}],
    method: [
      'Season chicken breast with salt, pepper and a drizzle of olive oil.',
      'Grill 6 min each side until cooked through. Rest 3 min.',
      'Steam white rice in 1:1.5 water ratio for 12 min.',
      'Slice chicken and plate alongside rice.',
      'Serve with lemon wedge and fresh herbs if desired.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 655, name: '150g Grilled Beef & Steamed Rice', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🥩',
    desc: 'Lean 5% beef mince patty grilled and served over steamed white rice. Bahrain grill menu classic — iron-rich, protein-dense, straightforward.',
    ings: [{id:9,amt:160},{id:32,amt:150}],
    method: [
      'Form beef mince into a flat patty or loose pieces. Season well.',
      'Grill or pan-fry over high heat 5–6 min each side.',
      'Steam white rice in 1:1.5 water ratio for 12 min.',
      'Rest beef 2 min then plate over rice.',
      'Serve immediately — no sauce needed.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 656, name: 'Steak Mushroom Platter', cat: 'Dinner',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🥩',
    desc: 'Sirloin steak with sautéed mushrooms and brown rice. A gym-favourite platter combining haem iron, B12 and sustained complex carbohydrates.',
    ings: [{id:6,amt:100},{id:77,amt:80},{id:31,amt:120}],
    method: [
      'Bring sirloin to room temperature. Season generously.',
      'Sear in a hot pan 3 min per side for medium. Rest 4 min.',
      'Sauté mushrooms in the same pan 3 min until golden.',
      'Cook brown rice in 1:2 water ratio for 25 min.',
      'Plate rice, top with steak and mushrooms.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 657, name: 'Chicken Breast & Broccoli Platter', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🥦',
    desc: 'Grilled chicken breast, steamed broccoli and brown rice — the original performance plate. High protein, sulforaphane-rich, low-calorie but filling.',
    ings: [{id:1,amt:120},{id:65,amt:100},{id:31,amt:70}],
    method: [
      'Season chicken with salt, pepper and herbs.',
      'Grill 6 min each side. Rest 3 min, then slice.',
      'Steam broccoli florets 5 min — keep bright green.',
      'Cook brown rice in 1:2 water ratio for 25 min.',
      'Plate rice, chicken and broccoli. Season broccoli with lemon.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 658, name: '150g Grilled Salmon & Steamed Rice', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🐟',
    desc: '150g Atlantic salmon fillet grilled and served over 150g steamed white rice. Premium omega-3 platter — the Bahrain healthy food order of choice.',
    ings: [{id:14,amt:150},{id:32,amt:150}],
    method: [
      'Pat salmon dry. Season with salt, pepper and lemon zest.',
      'Grill skin-down 5 min, flip and cook 3 min more.',
      'Steam white rice in 1:1.5 water ratio for 12 min.',
      'Rest salmon 2 min then plate over rice.',
      'Finish with a squeeze of lemon.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 659, name: 'Grilled Salmon & Broccoli Platter', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🐟',
    desc: 'Grilled salmon with steamed broccoli and sweet potato — a clean omega-3 and complex carb combination that fits every performance phase.',
    ings: [{id:14,amt:120},{id:65,amt:100},{id:48,amt:120}],
    method: [
      'Season salmon fillet and grill 5 min skin-down, 3 min flesh-side.',
      'Steam broccoli 5 min until tender-crisp.',
      'Steam or microwave sweet potato 8 min until soft.',
      'Plate sweet potato, broccoli and salmon.',
      'Finish with lemon juice and black pepper.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 660, name: 'Beef & Broccoli Platter', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🥩',
    desc: 'Lean beef mince with steamed broccoli and brown rice — iron, fibre and complex carbs in one plate. A Bahrain grill staple reinvented clean.',
    ings: [{id:9,amt:150},{id:65,amt:100},{id:31,amt:130}],
    method: [
      'Brown beef mince over high heat 6–8 min. Season well.',
      'Steam broccoli 5 min until bright green.',
      'Cook brown rice in 1:2 water ratio for 25 min.',
      'Plate rice, top with beef mince and broccoli.',
      'Serve with a pinch of chilli flakes if desired.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 661, name: 'Grill Chicken Steam Rice', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🍗',
    desc: 'Grilled chicken breast over steamed white rice with fresh tomato salsa. Light, clean, protein-forward — the everyday Bahrain fitness lunch.',
    ings: [{id:1,amt:160},{id:32,amt:140},{id:69,amt:80}],
    method: [
      'Season chicken with salt, pepper and olive oil.',
      'Grill 6 min per side until golden. Rest then slice.',
      'Steam rice in 1:1.5 water ratio for 12 min.',
      'Halve cherry tomatoes and season with lemon, salt and herbs.',
      'Plate rice, top with sliced chicken and tomato salsa.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 662, name: 'Grilled Chicken Wedges', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 20, serves: 1, emoji: '🍗',
    desc: 'Grilled chicken breast with roasted sweet potato wedges and steamed broccoli. Beta-carotene, sulforaphane and complete protein — performance eating.',
    ings: [{id:1,amt:130},{id:48,amt:170},{id:65,amt:100}],
    method: [
      'Cut sweet potato into wedges. Roast at 200°C for 20 min.',
      'Season chicken breast and grill 6 min per side.',
      'Steam broccoli 5 min until tender-crisp.',
      'Rest chicken 3 min then slice.',
      'Plate wedges, chicken and broccoli. Squeeze lemon to finish.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 663, name: 'Chicken Grain Rice Platter', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🍗',
    desc: 'Grilled chicken over brown grain rice with warm tomato passata. Clean, well-balanced and meal-prep friendly — batch-cook for the full week.',
    ings: [{id:1,amt:150},{id:31,amt:70},{id:152,amt:80}],
    method: [
      'Season and grill chicken breast 6 min per side. Slice.',
      'Cook brown rice in 1:2 water for 25 min.',
      'Warm passata in a small pan with salt and herbs.',
      'Plate rice, pour over passata and top with sliced chicken.',
      'Season with black pepper and fresh basil.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 664, name: 'Rosemary Beef Platter', cat: 'Dinner',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🥩',
    desc: 'Rosemary-seasoned lean beef mince with brown rice and steamed broccoli. Herb-forward, iron-rich and exactly what a performance dinner should be.',
    ings: [{id:9,amt:160},{id:31,amt:140},{id:65,amt:100}],
    method: [
      'Season beef mince with dried rosemary, salt and pepper.',
      'Cook in a hot pan 6–8 min, breaking up well.',
      'Steam broccoli 5 min. Cook brown rice for 25 min.',
      'Plate rice, top with rosemary beef and broccoli.',
      'Fresh rosemary garnish optional.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 665, name: 'Salmon Grain Rice Platter', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🐟',
    desc: 'Grilled salmon fillet over brown grain rice with warm tomato passata. Omega-3 meets fibre and lycopene — a longevity platter worth ordering twice.',
    ings: [{id:14,amt:120},{id:31,amt:100},{id:152,amt:60}],
    method: [
      'Cook brown rice in 1:2 water for 25 min. Fluff with fork.',
      'Season salmon and grill 5 min skin-down, 3 min flesh-side.',
      'Warm passata with a pinch of garlic and herbs.',
      'Plate rice, spoon passata over and top with salmon.',
      'Finish with lemon and cracked pepper.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },

  // ── GRILL MENU ─────────────────────────────────────────────────────────────
  {
    id: 666, name: 'Orange Glazed Chicken Bowl', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🍊',
    desc: 'Jasmine rice topped with orange-glazed grilled chicken breast. Bright citrus glaze, lean protein and light carbs — Gulf grill menu showpiece.',
    ings: [{id:1,amt:140},{id:34,amt:120},{id:116,amt:65}],
    method: [
      'Squeeze orange juice into a pan, reduce by half for glaze.',
      'Grill chicken breast 6 min per side. Brush with orange glaze in last 2 min.',
      'Cook jasmine rice in 1:1.5 water ratio for 12 min.',
      'Slice chicken and plate over rice.',
      'Drizzle remaining glaze and garnish with orange zest.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 667, name: 'Teriyaki Salmon Bowl', cat: 'Dinner',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🐟',
    desc: 'Atlantic salmon with teriyaki soy glaze over jasmine rice — sesame oil, umami depth and omega-3 in one clean bowl. Grill menu highlight.',
    ings: [{id:14,amt:120},{id:34,amt:120},{id:121,amt:5}],
    method: [
      'Mix soy sauce, sesame oil and a pinch of ginger for glaze.',
      'Season salmon and grill 5 min skin-down.',
      'Flip, brush with teriyaki glaze and cook 3 min more.',
      'Cook jasmine rice in 1:1.5 water for 12 min.',
      'Plate rice, top with salmon and drizzle remaining glaze. Sesame seeds to garnish.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 668, name: 'Rosemary Chicken Bowl', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🌿',
    desc: 'Rosemary and herb grilled chicken breast over jasmine rice. Fragrant, clean and high-protein — the most requested bowl on the Bahrain grill circuit.',
    ings: [{id:1,amt:150},{id:34,amt:100}],
    method: [
      'Rub chicken with rosemary, garlic, olive oil, salt and pepper.',
      'Grill 6 min per side until golden and cooked through.',
      'Rest 3 min then slice against the grain.',
      'Cook jasmine rice in 1:1.5 water for 12 min.',
      'Plate rice and top with rosemary chicken. Serve with lemon.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 669, name: 'Mexican Bowl', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🌮',
    desc: 'Grilled chicken, brown rice, chickpeas, avocado and sweet corn — the Bahrain grill menu favourite. Flavour-packed, high-volume and macro-balanced.',
    ings: [{id:1,amt:120},{id:31,amt:80},{id:148,amt:50},{id:118,amt:50},{id:90,amt:60}],
    method: [
      'Season chicken with cumin, paprika and chilli. Grill 6 min per side.',
      'Cook brown rice for 25 min. Warm chickpeas in a pan with cumin.',
      'Slice avocado and season with lime and salt.',
      'Warm corn kernels in the pan 2 min.',
      'Build the bowl: rice, chickpeas, chicken, avocado and corn. Lime to finish.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 670, name: 'Teriyaki Beef Bowl', cat: 'Dinner',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🥩',
    desc: 'Lean beef mince with teriyaki sesame glaze over jasmine rice. Iron-rich, flavour-bold and one of the fastest high-protein bowls in the Bahrain healthy food market.',
    ings: [{id:9,amt:180},{id:34,amt:150},{id:121,amt:5}],
    method: [
      'Brown beef mince over high heat 6 min. Season well.',
      'Add soy sauce and sesame oil to pan — toss to glaze, 2 min.',
      'Cook jasmine rice in 1:1.5 water for 12 min.',
      'Plate rice, spoon teriyaki beef over top.',
      'Garnish with sesame seeds and sliced spring onion.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 671, name: 'G. Chicken Sweet Potato Bowl', cat: 'Lunch',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 20, serves: 1, emoji: '🍗',
    desc: 'Grilled chicken breast with roasted sweet potato and steamed broccoli — beta-carotene, vitamin C and complete protein in one clean performance bowl.',
    ings: [{id:1,amt:150},{id:48,amt:130},{id:65,amt:60}],
    method: [
      'Cube sweet potato and steam or roast at 200°C for 20 min.',
      'Season chicken breast and grill 6 min per side.',
      'Steam broccoli 5 min until bright green.',
      'Rest chicken 3 min, then slice.',
      'Plate sweet potato, broccoli and sliced chicken. Season with lemon.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },
  {
    id: 672, name: 'Rosemary Salmon Bowl', cat: 'Dinner',
    goal: ['fat_loss','muscle_gain'], prep: 5, cook: 15, serves: 1, emoji: '🐟',
    desc: 'Rosemary-crusted Atlantic salmon over jasmine rice — simple herbs, omega-3 fats and clean carbs. A dinner bowl that tastes far more complex than it is.',
    ings: [{id:14,amt:130},{id:34,amt:110}],
    method: [
      'Press dried rosemary onto salmon fillet. Season with salt and pepper.',
      'Grill skin-down 5 min, flip and cook 3 min more.',
      'Cook jasmine rice in 1:1.5 water for 12 min.',
      'Rest salmon 2 min then plate over rice.',
      'Finish with a drizzle of olive oil and lemon wedge.',
    ],
    tags: ['Fitness','High Protein','Meal Prep'], custom: false, photo_url: '',
  },

  // ── KETO / LOW CARB ────────────────────────────────────────────────────────
  {
    id: 673, name: 'Keto Protein Platter', cat: 'Lunch',
    goal: ['fat_loss'], prep: 5, cook: 15, serves: 1, emoji: '🥑',
    desc: 'Grilled chicken, a whole egg, avocado and steamed broccoli — zero grains, maximum protein and healthy fats. The clean keto plate for peak fat loss.',
    ings: [{id:1,amt:100},{id:20,amt:60},{id:118,amt:50},{id:65,amt:130}],
    method: [
      'Season chicken breast and grill 6 min per side. Slice.',
      'Fry or poach one egg to preference.',
      'Steam broccoli 5 min until tender-crisp.',
      'Slice avocado and season with lemon and salt.',
      'Plate chicken, egg, avocado and broccoli. No carb sides.',
    ],
    tags: ['Keto','High Protein','Low Carb'], custom: false, photo_url: '',
  },
  {
    id: 674, name: 'Low Calorie Chicken Bowl', cat: 'Lunch',
    goal: ['fat_loss'], prep: 5, cook: 12, serves: 1, emoji: '🥒',
    desc: '120g grilled chicken breast over zucchini noodles with cherry tomatoes and olive oil. Under 300 kcal, over 35g protein — the lightest bowl on the menu.',
    ings: [{id:1,amt:120},{id:75,amt:200},{id:69,amt:100},{id:119,amt:5}],
    method: [
      'Season chicken and grill 5 min per side. Slice thin.',
      'Spiralise or peel zucchini into noodles.',
      'Sauté zucchini noodles in olive oil 2 min — keep firm.',
      'Halve cherry tomatoes and toss into pan for 1 min.',
      'Plate zoodles and tomatoes, top with sliced chicken. Lemon to finish.',
    ],
    tags: ['Low Calorie','Clean Eating','High Protein'], custom: false, photo_url: '',
  },
]

async function run() {
  console.log(`Inserting ${RECIPES.length} recipes…`)
  let ok = 0, fail = 0
  for (const r of RECIPES) {
    const { error } = await db.from('recipes').upsert(r, { onConflict: 'id' })
    if (error) {
      console.error(`  ✗ id=${r.id} "${r.name}": ${error.message}`)
      fail++
    } else {
      console.log(`  ✓ id=${r.id} "${r.name}"`)
      ok++
    }
  }
  console.log(`\nDone. ${ok} inserted/updated, ${fail} failed.`)
}

run()
