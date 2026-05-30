'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";

const parseArr = (f) => {
  if (Array.isArray(f)) return f
  if (typeof f === 'string') { try { return JSON.parse(f) } catch { return [] } }
  return []
}

// ─── Design tokens — Burnt Calories brand ──────────────────────────────────────
// Logo: flame orange #E8621A · leaf green #4A7C3F · charcoal #4A4A4A
const tk = {
  teal:"#2D5A27",     tealSurf:"#EAF3DE", tealText:"#1A3A15",
  blue:"#4A7C3F",     blueSurf:"#EAF3E6", blueText:"#243D1F",
  coral:"#E8621A",    coralSurf:"#FDEEE6",
  amber:"#C47C0A",    amberSurf:"#FDF3DC",
  green:"#7AB648",    greenSurf:"#EAF3DE",
  purple:"#7F77DD",   purpleSurf:"#EEEDFE",
  red:"#E24B4A",      gray:"#888780",
  flame:"#E8621A",
  bd:"0.5px solid var(--color-border-tertiary)",
  bdMed:"0.5px solid var(--color-border-secondary)",
  r:"var(--border-radius-md)", rLg:"var(--border-radius-lg)", rXl:"var(--border-radius-xl)",
};
const card = { background:"var(--color-background-primary)", border:tk.bd, borderRadius:tk.rLg, padding:20 };
const CAT_C = { Protein:tk.blue, Dairy:tk.purple, Carbohydrate:tk.teal, Vegetable:tk.green, Fat:tk.coral, Fruit:tk.amber, Spice:tk.red, Herb:tk.teal, Other:tk.gray };
const CAT_S = { Protein:tk.blueSurf, Dairy:tk.purpleSurf, Carbohydrate:tk.tealSurf, Vegetable:tk.greenSurf, Fat:tk.coralSurf, Fruit:tk.amberSurf, Spice:"#FEF0F0", Herb:tk.tealSurf, Other:"#F1EFE8" };

// ─── Master ingredient database (populated from Supabase at runtime) ────────────
let BASE_ING = [];

// ─── Seed recipes ──────────────────────────────────────────────────────────────
const SEED_RECIPES = [
  // ── BURNT CALORIES ORIGINALS ───────────────────────────────────────────────
  {id:1,  name:"Burnt Calories Power Oat Bowl",                  cat:"Breakfast",goal:["muscle_gain","fat_loss"],       prep:5,  cook:5,  serves:1, emoji:"🥣", desc:"80g oats, WPI and cinnamon — The ultimate pre-training breakfast. Fuel that sustains 2 hrs of hard training.", ings:[{id:39,amt:80},{id:22,amt:30},{id:21,amt:60}], method:["Mix oats with 250ml almond milk in a pot.","Simmer low heat 3–4 min, stirring.","Remove from heat, stir in WPI and cinnamon.","Top with blueberries and serve immediately.","Consume 60–90 min before training."], tags:["Pre-Workout","High Protein","Meal Prep"]},
  {id:2,  name:"Za'atar Chicken Salad",                cat:"Lunch",   goal:["fat_loss","longevity"],          prep:10, cook:12, serves:1, emoji:"🥗", desc:"Za'atar-rubbed chicken over cos, cherry tomatoes, cucumber and sumac-lemon dressing. Under 400 kcal, over 40g protein.", ings:[{id:1,amt:200},{id:60,amt:80},{id:69,amt:100},{id:85,amt:80},{id:137,amt:6}], method:["Rub chicken with za'atar, salt and olive oil.","Grill 6 min each side. Rest 3 min.","Slice and arrange over salad leaves.","Dress with sumac, lemon juice and EVOO.","Garnish with fresh mint."], tags:["Middle Eastern","Low Carb","Anti-Inflammatory"]},
  {id:3,  name:"Lamb Kofta with Freekeh",              cat:"Dinner",  goal:["muscle_gain","longevity"],       prep:15, cook:20, serves:2, emoji:"🍖", desc:"Baharat-spiced lamb kofta over smoky freekeh — a premium Gulf performance meal with iron, zinc and ancient grain fibre.", ings:[{id:12,amt:300},{id:41,amt:120},{id:130,amt:6},{id:138,amt:6},{id:115,amt:15}], method:["Mix lamb with baharat, cumin, garlic and parsley.","Shape into kofta torpedoes around skewers.","Grill 3–4 min each side until caramelised.","Cook freekeh 2:1 water ratio, 20 min.","Serve kofta over freekeh with cold yogurt."], tags:["Middle Eastern","Iron Rich","Performance"]},
  {id:4,  name:"Salmon Quinoa Power Bowl",              cat:"Dinner",  goal:["longevity","fat_loss"],          prep:10, cook:20, serves:1, emoji:"🐟", desc:"Pan-seared salmon over complete-protein quinoa with asparagus and cherry tomatoes. Omega-3 and sulforaphane in one bowl.", ings:[{id:14,amt:180},{id:38,amt:100},{id:74,amt:100},{id:69,amt:80},{id:119,amt:10}], method:["Season salmon with salt, pepper and lemon zest.","Sear skin-down in EVOO 4 min, flip 3 min.","Steam asparagus 5 min until tender-crisp.","Cook quinoa 1:2 ratio, fluff with fork.","Plate quinoa, top with salmon and asparagus."], tags:["Omega-3","Anti-Aging","Restaurant Quality"]},
  {id:5,  name:"Power Egg White Omelette",              cat:"Breakfast",goal:["fat_loss","muscle_gain"],      prep:5,  cook:8,  serves:1, emoji:"🍳", desc:"Egg whites, whole egg, mushrooms and spinach on Burgen soy-lin — a high protein, very low fat breakfast classic.", ings:[{id:21,amt:150},{id:20,amt:60},{id:77,amt:80},{id:57,amt:60},{id:56,amt:38}], method:["Whisk egg whites with one whole egg, season.","Sauté mushrooms and spinach in coconut oil 3 min.","Pour egg mix over vegetables.","Let set 2 min then fold gently.","Serve on toasted Burgen bread."], tags:["Low Fat","High Protein","Breakfast"]},
  {id:6,  name:"Rump Steak & Sweet Potato",             cat:"Dinner",  goal:["muscle_gain"],                  prep:5,  cook:15, serves:1, emoji:"🥩", desc:"200g rump steak, sweet potato mash and baby peas — Iron, zinc, slow carbs, high protein. A performance dinner classic.", ings:[{id:5,amt:200},{id:48,amt:150},{id:88,amt:100}], method:["Bring steak to room temp, season generously.","Sear in cast-iron pan 3–4 min per side for medium.","Rest 5 min before slicing.","Steam sweet potato, mash with a pinch coconut oil.","Plate with steamed baby peas."], tags:["Iron Rich","Muscle Building","Performance"]},
  {id:7,  name:"Baharat Chicken Basmati Bowl",          cat:"Lunch",   goal:["muscle_gain","longevity"],       prep:10, cook:25, serves:1, emoji:"🍲", desc:"Baharat-spiced chicken over fragrant basmati with roasted capsicum and fresh coriander. Aromatic Gulf performance food.", ings:[{id:1,amt:200},{id:33,amt:120},{id:71,amt:100},{id:138,amt:6},{id:116,amt:10}], method:["Marinate chicken in baharat, olive oil and garlic.","Grill or pan-fry 6 min per side.","Cook basmati and fluff with fork.","Roast capsicum strips 15 min at 200°C.","Plate basmati, chicken, capsicum and coriander."], tags:["Middle Eastern","Aromatic","Performance"]},
  {id:8,  name:"Overnight Protein Oats",                cat:"Breakfast",goal:["longevity","muscle_gain"],     prep:5,  cook:0,  serves:1, emoji:"🌾", desc:"WPI-fortified overnight oats with chia seeds and almonds. Batch prep Sunday — grab and go all week.", ings:[{id:39,amt:80},{id:22,amt:30},{id:125,amt:20},{id:122,amt:30}], method:["Combine oats, WPI and chia seeds in a jar.","Pour over 300ml almond milk. Stir.","Top with sliced almonds.","Refrigerate minimum 4 hours or overnight.","Eat cold or warm 90 sec in microwave."], tags:["Meal Prep","Slow Release","Heart Healthy"]},
  {id:9,  name:"Post-Workout Recovery Shake",           cat:"Snack",   goal:["muscle_gain","fat_loss"],       prep:2,  cook:0,  serves:1, emoji:"🥤", desc:"WPI, banana and blueberries — consume within 30 min post-training for MPS and glycogen replenishment.", ings:[{id:22,amt:30},{id:105,amt:120},{id:99,amt:50}], method:["Add WPI, banana and blueberries to blender.","Add 300ml almond milk and ice cubes.","Blend until smooth.","Consume within 30 minutes post-workout.","Great post-workout or pre-bed option."], tags:["Post-Workout","Recovery","Antioxidant"]},
  {id:10, name:"Greek Yogurt Longevity Parfait",         cat:"Snack",   goal:["longevity","fat_loss"],         prep:5,  cook:0,  serves:1, emoji:"🍦", desc:"Full fat Greek yogurt with pomegranate, pumpkin seeds and chia. Probiotic, antioxidant-dense, testosterone-supporting.", ings:[{id:24,amt:200},{id:113,amt:50},{id:124,amt:20},{id:125,amt:10}], method:["Spoon Greek yogurt into a bowl or glass.","Scatter pomegranate arils on top.","Sprinkle pumpkin seeds and chia seeds.","Optional tiny drizzle of raw honey.","Best consumed as an afternoon snack or light breakfast."], tags:["Probiotic","Longevity","Gut Health"]},
  {id:11, name:"Chicken Broccoli Brown Rice",            cat:"Dinner",  goal:["fat_loss","muscle_gain"],       prep:10, cook:20, serves:1, emoji:"🍱", desc:"The elevated bodybuilder staple — coconut oil chicken, sulforaphane broccoli, brown rice. Simple. Effective. Delicious.", ings:[{id:1,amt:200},{id:65,amt:100},{id:31,amt:150},{id:120,amt:7}], method:["Season chicken with paprika, cumin and garlic.","Pan-fry in coconut oil 6 min each side.","Steam broccoli 5 min until bright green.","Serve over warm brown rice.","Drizzle with low-sodium soy or fresh lemon."], tags:["Classic","Sulforaphane Rich","Lean Muscle"]},
  {id:12, name:"Turkish Red Lentil Soup",                cat:"Lunch",   goal:["longevity","fat_loss"],         prep:10, cook:25, serves:2, emoji:"🫕", desc:"Cumin and coriander red lentil soup with smoked paprika oil finish. Arabic classic, highest fibre legume, gut-healing.", ings:[{id:149,amt:150},{id:80,amt:100},{id:130,amt:6},{id:131,amt:5},{id:134,amt:4}], method:["Sauté onion in olive oil until golden.","Add garlic, cumin and coriander, toast 1 min.","Add red lentils and 600ml stock. Simmer 20 min.","Blend until smooth.","Finish with smoked paprika oil and fresh lemon."], tags:["Middle Eastern","High Fibre","Gut Health"]},
  {id:13, name:"Ribeye & Roasted Vegetables",            cat:"Dinner",  goal:["muscle_gain"],                  prep:10, cook:20, serves:1, emoji:"🥩", desc:"Premium ribeye with roasted capsicum, zucchini and herb olive oil. High calorie, high flavour — restaurant at home.", ings:[{id:7,amt:250},{id:71,amt:100},{id:75,amt:100},{id:119,amt:15}], method:["Season ribeye generously, rest at room temp 20 min.","Sear in screaming hot cast-iron 3 min per side.","Roast vegetables 200°C with EVOO and herbs 15 min.","Rest steak 5 min, slice against grain.","Plate vegetables, top with steak. Drizzle EVOO."], tags:["Premium Cut","Calorie Dense","Bulking"]},
  {id:14, name:"Berry Açaí Power Bowl",                  cat:"Breakfast",goal:["longevity"],                  prep:10, cook:0,  serves:1, emoji:"🫐", desc:"Frozen açaí blended with mixed berries, topped with goji berries, chia and blueberries. Highest ORAC antioxidant breakfast.", ings:[{id:103,amt:100},{id:99,amt:50},{id:100,amt:50},{id:104,amt:20},{id:125,amt:15}], method:["Blend açaí pulp with a splash of almond milk until thick.","Pour into a bowl — it should hold a spoon.","Top with blueberries, strawberries and goji berries.","Sprinkle chia seeds over the top.","Drizzle with a little raw honey if desired."], tags:["Antioxidant","Longevity","Superfood"]},
  {id:15, name:"Casein Night Recovery Bowl",             cat:"Snack",   goal:["muscle_gain"],                  prep:3,  cook:0,  serves:1, emoji:"🌙", desc:"Cottage cheese, pumpkin seeds and walnuts — casein protein digests slowly all night rebuilding muscle as you sleep.", ings:[{id:25,amt:200},{id:124,amt:20},{id:123,amt:15}], method:["Spoon cottage cheese into a bowl.","Top with pumpkin seeds and walnut halves.","Optional pinch of cinnamon.","Consume 30–60 min before bed.","Casein slow-digests overnight for continuous muscle repair."], tags:["Casein Protein","Night Recovery","Performance"]},

  // ── BURNT CALORIES MENU ────────────────────────────────────────────────────
  {id:16, name:"Golden Harissa Chicken Zoodles",        cat:"Dinner",  goal:["fat_loss","longevity"],         prep:10, cook:15, serves:1, emoji:"🌶️", desc:"Harissa-marinated chicken breast over spiralised zucchini noodles with roasted capsicum. Bold flavour, ultra-low carb.", ings:[{id:1,amt:200},{id:75,amt:250},{id:71,amt:100},{id:141,amt:15},{id:119,amt:10}], method:["Marinate chicken in harissa paste, olive oil and lemon 30 min.","Spiralise or peel zucchini into noodles.","Grill chicken 6 min per side. Rest then slice.","Sauté zoodles and capsicum in EVOO 3 min — keep crunch.","Plate zoodles, top with chicken and extra harissa drizzle."], tags:["Low Carb","North African","High Protein"]},
  {id:17, name:"Spiced Beef & Lavash Wraps",            cat:"Lunch",   goal:["muscle_gain","fat_loss"],       prep:15, cook:15, serves:2, emoji:"🌯", desc:"Baharat-spiced beef mince with diced tomato, red onion and tahini yogurt rolled in warm lavash flatbread.", ings:[{id:9,amt:250},{id:69,amt:100},{id:81,amt:60},{id:89,amt:20},{id:54,amt:100}], method:["Brown beef mince with baharat, cumin and garlic.","Add diced tomato and simmer 5 min.","Mix tahini with yogurt and lemon for sauce.","Warm lavash on a dry pan 30 sec each side.","Fill with beef, red onion, tomato and tahini sauce. Roll tight."], tags:["Middle Eastern","Meal Prep","High Protein"]},
  {id:18, name:"Gulf Snapper Tikka with Saffron Basmati",cat:"Dinner", goal:["longevity","fat_loss"],         prep:20, cook:20, serves:2, emoji:"🐠", desc:"Tikka-spiced Gulf snapper fillets over saffron-infused basmati with charred lemon and fresh coriander.", ings:[{id:17,amt:300},{id:33,amt:150},{id:107,amt:3},{id:129,amt:0.4},{id:116,amt:15}], method:["Marinate snapper in tikka paste, yogurt and lemon 1 hr.","Bloom saffron in 2 tbsp warm water for 10 min.","Cook basmati, add saffron water halfway through.","Grill snapper 4 min per side until slightly charred.","Plate saffron rice, top with fish and fresh coriander."], tags:["Gulf Cuisine","Omega-3","Restaurant Quality"]},
  {id:19, name:"Chilli Garlic Prawn Bowl",               cat:"Dinner",  goal:["fat_loss","muscle_gain"],      prep:10, cook:12, serves:1, emoji:"🦐", desc:"Chilli garlic king prawns over jasmine rice with stir-fried bok choy. High protein, low fat, big bold flavour.", ings:[{id:19,amt:200},{id:34,amt:120},{id:68,amt:150},{id:83,amt:4},{id:135,amt:5}], method:["Toss prawns in chilli, minced garlic, soy and sesame oil.","Cook jasmine rice per instructions.","Sauté bok choy in garlic 3 min until just wilted.","Stir-fry prawns in a hot pan 2 min per side.","Serve over rice with bok choy and extra chilli."], tags:["High Protein","Low Fat","Asian Fusion"]},
  {id:20, name:"Prawn & Barramundi Arborio Bowl",        cat:"Dinner",  goal:["longevity","muscle_gain"],      prep:15, cook:25, serves:2, emoji:"🫙", desc:"Slow-stirred arborio risotto with seared barramundi, king prawns, saffron and fresh herbs. Elegant longevity dining.", ings:[{id:15,amt:150},{id:19,amt:120},{id:129,amt:0.4},{id:80,amt:60},{id:119,amt:15}], method:["Sauté onion in EVOO until soft. Add arborio, toast 2 min.","Add warm stock ladle by ladle, stirring constantly 18 min.","Stir in saffron water, parmesan and lemon zest.","Sear barramundi 3 min per side. Pan-fry prawns 2 min.","Spoon risotto, top with fish, prawns and fresh herbs."], tags:["Restaurant Quality","Omega-3","Longevity"]},
  {id:21, name:"Saffron & Cardamom Protein Oats",       cat:"Breakfast",goal:["longevity","fat_loss"],        prep:5,  cook:5,  serves:1, emoji:"🌅", desc:"Saffron-bloomed oats with cardamom, WPI and a drizzle of honey — inspired by Gulf breakfast tradition with a protein upgrade.", ings:[{id:39,amt:70},{id:22,amt:25},{id:129,amt:0.4},{id:103,amt:2},{id:125,amt:15}], method:["Bloom saffron in 2 tbsp warm water for 5 min.","Cook oats with 200ml milk or almond milk.","Stir in WPI, saffron water and ground cardamom.","Transfer to bowl and top with chia seeds.","Drizzle with a tiny amount of raw honey. Serve warm."], tags:["Middle Eastern","Longevity","Anti-Inflammatory"]},
  {id:22, name:"Bahraini Chicken Shakshuka",             cat:"Breakfast",goal:["fat_loss","longevity"],       prep:10, cook:20, serves:2, emoji:"🍳", desc:"Spiced tomato passata with shredded baharat chicken, poached eggs and fresh coriander. A pan full of cozy Gulf comfort.", ings:[{id:1,amt:200},{id:152,amt:200},{id:20,amt:120},{id:138,amt:6},{id:70,amt:80}], method:["Cook chicken with baharat until shredded.","Sauté onion and garlic, add passata and spices.","Simmer tomato sauce 10 min until thickened.","Stir in shredded chicken. Make wells for eggs.","Crack eggs into wells, cover and cook 5 min. Top with coriander."], tags:["Middle Eastern","High Protein","Gut Health"]},
  {id:23, name:"Almond-Stuffed Medjool Dates",          cat:"Snack",   goal:["longevity","maintenance"],      prep:5,  cook:0,  serves:1, emoji:"🌴", desc:"Medjool dates filled with almond butter and a whole almond. Natural energy, Gulf tradition, potassium and magnesium.", ings:[{id:112,amt:72},{id:127,amt:20},{id:122,amt:10}], method:["Slice dates lengthways and remove the pit.","Fill each date with a small spoon of almond butter.","Press a whole almond on top to finish.","Arrange on a plate and serve at room temperature.","Perfect pre-workout natural energy or afternoon snack."], tags:["Natural Energy","Gulf Tradition","Pre-Workout"]},
  {id:24, name:"Burnt Calories Cobb Salad",                  cat:"Lunch",   goal:["fat_loss","muscle_gain"],       prep:15, cook:12, serves:1, emoji:"🥗", desc:"Grilled chicken, boiled eggs, avocado, cherry tomatoes and cos over a bed of greens with a light lemon dressing.", ings:[{id:1,amt:180},{id:20,amt:120},{id:118,amt:75},{id:69,amt:80},{id:60,amt:80}], method:["Grill chicken with mixed herbs until cooked. Rest and slice.","Hard-boil eggs 8 min, peel and halve.","Slice avocado and halve cherry tomatoes.","Arrange all ingredients over cos lettuce.","Dress with lemon juice, EVOO, salt and pepper."], tags:["High Protein","Healthy Fats","Classic"]},
  {id:25, name:"Burnt Calories Breakfast Bowl",       cat:"Breakfast",goal:["muscle_gain","fat_loss"],      prep:5,  cook:10, serves:1, emoji:"🍳", desc:"Scrambled eggs, turkey mince, roasted sweet potato cubes and wilted spinach — high-protein fuel for a full morning.", ings:[{id:20,amt:120},{id:4,amt:100},{id:48,amt:100},{id:57,amt:60}], method:["Dice sweet potato small, roast at 200°C for 15 min until golden.","Brown turkey mince with baharat and garlic.","Scramble eggs soft in a separate pan.","Wilt spinach for 1 min.","Build bowl: sweet potato base, turkey, eggs, spinach."], tags:["High Protein","Meal Prep","Breakfast"]},
  {id:26, name:"Turmeric Cauliflower Mash & Chicken",   cat:"Dinner",  goal:["fat_loss","longevity"],         prep:10, cook:20, serves:1, emoji:"🍽️", desc:"Grilled chicken breast over creamy turmeric cauliflower mash with roasted cherry tomatoes and a marinara drizzle.", ings:[{id:1,amt:200},{id:66,amt:200},{id:69,amt:80},{id:100,amt:3},{id:152,amt:60}], method:["Steam cauliflower until very soft, 12 min.","Blend with EVOO, turmeric, salt and garlic into smooth mash.","Season and grill chicken 6 min per side.","Roast cherry tomatoes in oven 200°C for 10 min.","Plate mash, top with sliced chicken, tomatoes and marinara."], tags:["Low Carb","Anti-Inflammatory","Longevity"]},
  {id:27, name:"Roasted Beetroot & Rocket Salad",       cat:"Lunch",   goal:["longevity","fat_loss"],         prep:10, cook:30, serves:2, emoji:"🥗", desc:"Roasted beetroot, rocket, walnuts and pomegranate with a balsamic dressing. Nitrates, antioxidants, performance salad.", ings:[{id:87,amt:200},{id:61,amt:80},{id:123,amt:30},{id:113,amt:40},{id:119,amt:15}], method:["Dice beetroot, toss with EVOO and roast 200°C for 30 min.","Allow to cool for 5 min.","Build salad with rocket, walnuts and pomegranate arils.","Top with roasted beetroot.","Dress with balsamic, EVOO, salt and pepper."], tags:["Longevity","Nitrates","Anti-Inflammatory"]},
  {id:28, name:"Eggplant & Tomato Shakshuka",           cat:"Breakfast",goal:["longevity","fat_loss"],        prep:10, cook:20, serves:2, emoji:"🍆", desc:"Roasted eggplant in spiced tomato sauce with poached eggs, halloumi and za'atar. A vegetarian longevity powerhouse.", ings:[{id:76,amt:200},{id:152,amt:200},{id:20,amt:120},{id:137,amt:8},{id:138,amt:4}], method:["Dice eggplant, roast in EVOO at 200°C for 20 min.","Sauté onion and garlic, add passata and baharat.","Add roasted eggplant to the sauce, simmer 5 min.","Make wells, crack eggs in and cover 5 min.","Finish with za'atar and fresh coriander."], tags:["Vegetarian","Middle Eastern","Longevity"]},
  {id:29, name:"Beef Dum Biryani",                      cat:"Dinner",  goal:["muscle_gain"],                  prep:20, cook:40, serves:3, emoji:"🫕", desc:"Slow-cooked spiced beef mince layered with fragrant basmati, caramelised onion and fresh herbs. A royal blend of heritage.", ings:[{id:9,amt:300},{id:33,amt:200},{id:80,amt:100},{id:106,amt:6},{id:116,amt:15}], method:["Brown beef with curry powder, cumin, coriander and garlic.","Caramelise onions in a separate pan until golden-brown.","Parboil basmati rice 8 min, drain.","Layer rice over beef in pot, add onions and herbs on top.","Seal pot with foil and dum-cook on low heat 20 min."], tags:["Indian-Gulf","Calorie Dense","Heritage"]},
  {id:30, name:"Chermoula Snapper with Cauliflower",    cat:"Dinner",  goal:["fat_loss","longevity"],         prep:15, cook:20, serves:1, emoji:"🐟", desc:"Moroccan chermoula-spiced Gulf snapper over roasted cauliflower with a pomegranate-herb salsa. North African longevity.", ings:[{id:17,amt:200},{id:66,amt:200},{id:116,amt:10},{id:113,amt:30},{id:119,amt:10}], method:["Make chermoula: blend coriander, parsley, garlic, cumin, paprika, EVOO and lemon.","Coat snapper in chermoula, marinate 30 min.","Roast cauliflower florets at 200°C for 20 min.","Grill snapper 4 min per side.","Plate cauliflower, top with fish, pomegranate arils and fresh herbs."], tags:["North African","Omega-3","Low Carb"]},
  {id:31, name:"Malabar Chicken Curry with Basmati",    cat:"Dinner",  goal:["muscle_gain","longevity"],      prep:15, cook:30, serves:2, emoji:"🍛", desc:"Coconut milk chicken curry with garam masala, ginger and turmeric over fragrant basmati. South Indian coast meets Gulf kitchen.", ings:[{id:1,amt:350},{id:153,amt:150},{id:33,amt:180},{id:105,amt:5},{id:100,amt:3}], method:["Sauté onion, ginger and garlic until golden.","Add garam masala, turmeric and chilli. Toast 1 min.","Add chicken and coat in spices.","Pour in coconut milk and simmer 20 min until cooked.","Serve over basmati with fresh coriander."], tags:["Indian","Coconut","Muscle Gain"]},
  {id:32, name:"Cajun Shrimp Penne",                    cat:"Dinner",  goal:["muscle_gain","maintenance"],    prep:10, cook:15, serves:1, emoji:"🍝", desc:"Cajun-spiced king prawns with wholemeal penne in a light tomato cream sauce. Gulf fusion pasta done right.", ings:[{id:19,amt:180},{id:46,amt:120},{id:152,amt:100},{id:119,amt:8},{id:135,amt:4}], method:["Cook penne per instructions. Reserve 50ml pasta water.","Toss prawns in Cajun spices — chilli, paprika, garlic, cumin.","Sear prawns in EVOO 2 min per side.","Add passata and a splash of pasta water to pan, simmer 3 min.","Toss penne in sauce with prawns. Finish with fresh parsley."], tags:["Gulf Fusion","High Protein","Pasta"]},
  {id:33, name:"Mixed Berry Protein Oatmeal",           cat:"Breakfast",goal:["longevity","fat_loss"],        prep:5,  cook:5,  serves:1, emoji:"🫐", desc:"Warm oats loaded with mixed berries, WPI and chia seeds. The highest antioxidant breakfast in the Burnt Calories menu.", ings:[{id:39,amt:70},{id:22,amt:25},{id:99,amt:50},{id:100,amt:40},{id:101,amt:40}], method:["Cook oats with 250ml milk or almond milk until creamy.","Stir in WPI off the heat.","Pour into bowl and top generously with mixed berries.","Sprinkle chia seeds over the top.","Serve immediately — berries should still be cold on warm oats."], tags:["Antioxidant","High Protein","Longevity"]},
  {id:34, name:"Za'atar Fish with Jasmine Rice",        cat:"Dinner",  goal:["longevity","fat_loss"],         prep:10, cook:20, serves:1, emoji:"🐠", desc:"Za'atar-crusted snapper over jasmine rice with a tangy salsa verde and roasted tomatoes. Light, bold, full of flavour.", ings:[{id:17,amt:200},{id:34,amt:120},{id:137,amt:8},{id:69,amt:80},{id:119,amt:10}], method:["Press za'atar onto snapper fillets. Season with salt.","Sear in EVOO 3–4 min per side skin-down first.","Cook jasmine rice per instructions.","Roast cherry tomatoes 200°C for 10 min.","Plate rice, top with fish and roasted tomatoes. Drizzle EVOO."], tags:["Middle Eastern","Omega-3","Light"]},
  {id:35, name:"Madhbi-Style Chicken with Herb Rice",  cat:"Dinner",  goal:["longevity","muscle_gain"],      prep:15, cook:30, serves:2, emoji:"🍗", desc:"Bahraini madhbi-inspired grilled chicken with fragrant herb rice, tahini drizzle and a tangy pickled cabbage slaw.", ings:[{id:2,amt:350},{id:33,amt:180},{id:89,amt:20},{id:116,amt:15},{id:130,amt:4}], method:["Season chicken thighs with cumin, baharat and olive oil.","Grill or oven-bake at 200°C for 25 min until golden.","Cook basmati with fresh herbs stirred through.","Make tahini sauce: tahini, lemon juice, water, garlic.","Plate herb rice, top with chicken and drizzle tahini."], tags:["Bahraini","Heritage","Longevity"]},
  {id:36, name:"Avocado Egg Breakfast Sandwich",        cat:"Breakfast",goal:["fat_loss","longevity"],        prep:5,  cook:8,  serves:1, emoji:"🥑", desc:"Soft-scrambled eggs and smashed avocado on toasted wholegrain bread with sliced tomato and rocket. The perfect balanced breakfast.", ings:[{id:20,amt:120},{id:118,amt:75},{id:47,amt:76},{id:69,amt:80},{id:61,amt:30}], method:["Toast two slices of wholegrain bread until golden.","Scramble eggs gently — remove from heat while still glossy.","Smash avocado with lemon, salt and chilli flakes.","Spread smashed avocado on toast.","Top with scrambled eggs, sliced tomato and rocket."], tags:["Healthy Fats","Balanced","Breakfast Classic"]},
  {id:37, name:"Truffle Cauliflower & Lemon Soup",      cat:"Lunch",   goal:["fat_loss","longevity"],         prep:10, cook:25, serves:2, emoji:"🥣", desc:"Silky blended cauliflower soup with a drizzle of sesame oil, lemon and fresh herbs. Ultra-low calorie, deeply satisfying.", ings:[{id:66,amt:400},{id:80,amt:80},{id:83,amt:3},{id:114,amt:5},{id:119,amt:8}], method:["Sauté onion in EVOO until soft.","Add cauliflower and 600ml chicken stock. Simmer 20 min.","Blend until completely smooth and silky.","Season with salt, pepper and lemon juice.","Serve with a drizzle of sesame oil and fresh thyme."], tags:["Low Calorie","Longevity","Gut Health"]},
  {id:38, name:"Spiced Minced Chicken & Pita",          cat:"Lunch",   goal:["muscle_gain","fat_loss"],       prep:10, cook:15, serves:1, emoji:"🫓", desc:"Spiced minced chicken with onion, garlic and herbs served in warm pita with tahini and fresh parsley. A meal that tastes like home.", ings:[{id:1,amt:220},{id:80,amt:60},{id:53,amt:60},{id:89,amt:20},{id:115,amt:10}], method:["Mince or finely dice chicken.","Brown with onion, garlic, cumin, coriander and chilli.","Warm pita on a dry pan or oven for 2 min.","Mix tahini with lemon juice and water until pourable.","Fill pita with spiced chicken, drizzle tahini, top with parsley."], tags:["Middle Eastern","High Protein","Street Food"]},
  {id:39, name:"Mustard Beef with Pickles & Couscous",  cat:"Dinner",  goal:["muscle_gain"],                  prep:10, cook:20, serves:1, emoji:"🥩", desc:"Seared sirloin in a wholegrain mustard pan sauce with couscous and tangy pickled vegetables. Tangy enough to remember.", ings:[{id:6,amt:200},{id:43,amt:120},{id:80,amt:50},{id:119,amt:10}], method:["Cook couscous with boiling stock, cover 5 min and fluff.","Season sirloin and sear in a hot pan 3 min per side.","Remove steak, deglaze pan with stock and mustard.","Simmer sauce 2 min, adjust seasoning.","Slice steak, plate over couscous, drizzle mustard sauce."], tags:["French-Gulf","Performance","High Protein"]},
  {id:40, name:"Turkey Picadillo with Pita",            cat:"Dinner",  goal:["fat_loss","muscle_gain"],       prep:10, cook:20, serves:2, emoji:"🫙", desc:"Lean turkey mince cooked picadillo-style with tomato, olives, cumin and coriander. Classic made light with turkey.", ings:[{id:4,amt:300},{id:69,amt:150},{id:80,amt:80},{id:130,amt:5},{id:116,amt:10}], method:["Brown turkey mince with onion and garlic.","Add diced tomato, cumin, coriander and a pinch of cinnamon.","Simmer 15 min until flavours meld and sauce thickens.","Taste and adjust seasoning.","Serve with warm pita and fresh coriander on top."], tags:["Lean Protein","Meal Prep","Latin-Gulf"]},
  {id:41, name:"Chimichurri Beef Quinoa Bowl",          cat:"Dinner",  goal:["longevity","muscle_gain"],      prep:15, cook:15, serves:1, emoji:"🥩", desc:"Seared sirloin over quinoa with a vibrant chimichurri of parsley, garlic and EVOO. Big flavours in a clean longevity bowl.", ings:[{id:6,amt:200},{id:38,amt:120},{id:115,amt:20},{id:119,amt:15},{id:70,amt:3}], method:["Cook quinoa 1:2 ratio, fluff with fork. Season.","Blend chimichurri: parsley, garlic, EVOO, red wine vinegar, chilli, salt.","Season and sear sirloin 3 min per side for medium.","Rest 5 min, slice thin against grain.","Plate quinoa, top with steak, spoon chimichurri generously."], tags:["Latin-Gulf","Anti-Inflammatory","Restaurant Quality"]},
  {id:42, name:"Chicken & Okra Gulf Stew",              cat:"Dinner",  goal:["longevity","fat_loss"],         prep:15, cook:35, serves:2, emoji:"🍲", desc:"Slow-simmered chicken and okra in a rich tomato-spiced broth with basmati. Feels like home. Gulf comfort food elevated.", ings:[{id:1,amt:300},{id:152,amt:200},{id:33,amt:160},{id:138,amt:6},{id:80,amt:80}], method:["Sauté onion in EVOO until golden.","Add chicken pieces with baharat and cumin, brown all sides.","Add passata and 200ml stock. Simmer 20 min.","Add trimmed okra and simmer 10 more min.","Serve over fragrant basmati rice."], tags:["Gulf Comfort","Heritage","Longevity"]},
  {id:43, name:"Egg & Turkey Breakfast Bowl",           cat:"Breakfast",goal:["muscle_gain","fat_loss"],      prep:5,  cook:12, serves:1, emoji:"🥚", desc:"Scrambled eggs with turkey mince, roasted sweet potato and baby spinach. High-protein morning power to fuel your day.", ings:[{id:20,amt:120},{id:4,amt:100},{id:48,amt:100},{id:57,amt:60}], method:["Dice sweet potato small. Pan-fry in coconut oil until golden, 10 min.","Brown turkey mince with salt, pepper and smoked paprika.","Scramble eggs gently in a separate pan.","Wilt spinach for 1 min in a hot pan.","Layer in a bowl: sweet potato, turkey, eggs, spinach."], tags:["High Protein","Breakfast","Meal Prep"]},
  {id:44, name:"Honey Mustard Chicken Bowl",            cat:"Lunch",   goal:["fat_loss","maintenance"],       prep:10, cook:20, serves:1, emoji:"🍗", desc:"Honey mustard glazed chicken thigh with jasmine rice, sautéed cabbage and a light tahini drizzle. Balanced and bright.", ings:[{id:2,amt:200},{id:34,amt:130},{id:66,amt:150},{id:89,amt:15}], method:["Mix honey, dijon mustard, garlic and soy sauce for glaze.","Coat chicken thigh and bake 200°C for 20 min.","Cook jasmine rice per instructions.","Stir-fry cauliflower or cabbage until just tender.","Plate rice, top with glazed chicken and tahini drizzle."], tags:["Balanced","Gulf Fusion","Meal Prep"]},
  {id:45, name:"Japanese-Inspired Braised Beef Bowl",   cat:"Dinner",  goal:["longevity","muscle_gain"],      prep:10, cook:35, serves:2, emoji:"🍱", desc:"Slow-braised beef mince in soy, ginger and mirin over white rice with a soft-poached egg. Slow and umami-rich.", ings:[{id:9,amt:300},{id:32,amt:180},{id:20,amt:120},{id:84,amt:5},{id:82,amt:4}], method:["Brown beef mince in a hot pan. Drain excess fat.","Add soy sauce, mirin, ginger, garlic and 100ml stock.","Simmer low heat 25 min until glossy and thick.","Cook white rice.","Plate rice, top with braised beef and a soft-poached egg."], tags:["Asian-Gulf","Umami","Longevity"]},
  {id:46, name:"Beef Arayes with Tahini",               cat:"Lunch",   goal:["muscle_gain","fat_loss"],       prep:15, cook:15, serves:2, emoji:"🫓", desc:"Spiced beef-stuffed toasted bread pockets with tomato, onion and tahini dressing. It will raise your standards for arayes.", ings:[{id:9,amt:250},{id:53,amt:120},{id:69,amt:80},{id:81,amt:60},{id:89,amt:25}], method:["Mix beef with onion, parsley, baharat, cumin and chilli.","Stuff pita pockets full with beef mixture.","Toast in a dry pan or oven 6 min per side until crisp.","Mix tahini with lemon, garlic and water until pourable.","Serve hot arayes with tahini dipping sauce and tomato salad."], tags:["Middle Eastern","Street Food","High Protein"]},
  {id:47, name:"Halloumi Foul Medames Bowl",            cat:"Breakfast",goal:["longevity","fat_loss"],        prep:10, cook:15, serves:1, emoji:"🫘", desc:"Traditional foul medames with grilled halloumi, cherry tomatoes and crispy pita. A Gulf breakfast powerhouse.", ings:[{id:148,amt:150},{id:69,amt:80},{id:53,amt:60},{id:119,amt:8},{id:116,amt:10}], method:["Warm chickpeas or foul in pan with cumin, garlic and lemon.","Mash lightly and season well.","Grill halloumi slices 2 min per side until golden.","Toast pita triangles in a dry pan.","Plate foul, top with halloumi, cherry tomatoes, EVOO and coriander."], tags:["Gulf Breakfast","Vegetarian","Longevity"]},
  {id:48, name:"Banana Protein Pancakes",               cat:"Breakfast",goal:["muscle_gain","maintenance"],   prep:10, cook:10, serves:1, emoji:"🥞", desc:"Fluffy banana and WPI pancakes with warm berries and Greek yogurt. Protein-packed, naturally sweet, completely satisfying.", ings:[{id:105,amt:120},{id:22,amt:30},{id:20,amt:100},{id:39,amt:30},{id:23,amt:80}], method:["Mash banana with eggs, WPI and oat flour into batter.","Rest batter 2 min.","Cook tablespoon-sized pancakes in a non-stick pan on medium.","Flip when bubbles form, 2 min per side.","Stack with Greek yogurt, warm berries and a drizzle of honey."], tags:["Protein Breakfast","Indulgent Nutrition","Pre-Workout"]},
  {id:49, name:"Baked Snapper & Sweet Potato Mash",     cat:"Dinner",  goal:["longevity","fat_loss"],         prep:10, cook:25, serves:1, emoji:"🐟", desc:"Za'atar-baked Gulf snapper over roasted sweet potato mash with green beans and lemon. Clean, nourishing, restaurant-worthy.", ings:[{id:17,amt:200},{id:48,amt:180},{id:92,amt:100},{id:137,amt:6},{id:119,amt:8}], method:["Rub snapper with za'atar, EVOO and lemon zest.","Bake at 190°C for 18 min until flesh flakes easily.","Steam sweet potato, mash with EVOO and salt.","Blanch green beans 3 min.","Plate mash, top with fish and beans. Squeeze fresh lemon."], tags:["Gulf Fish","Low Calorie","Longevity"]},
  {id:50, name:"Coriander Chicken Tikka Bowl",          cat:"Dinner",  goal:["muscle_gain","fat_loss"],       prep:20, cook:20, serves:2, emoji:"🍛", desc:"Yogurt-marinated chicken tikka with coriander chutney over basmati. Tikka with a vibrant green twist of fresh herb magic.", ings:[{id:1,amt:320},{id:33,amt:180},{id:23,amt:80},{id:106,amt:6},{id:116,amt:15}], method:["Marinate chicken in yogurt, tikka masala, ginger and garlic 2 hrs.","Grill or bake at 200°C for 20 min until charred.","Cook basmati and fluff.","Blend fresh coriander, mint, chilli, garlic and yogurt for chutney.","Plate basmati, top with tikka and drizzle coriander chutney."], tags:["Indian","High Protein","Flavour Bomb"]},
  {id:51, name:"Curried Mince on Coconut Rice",         cat:"Dinner",  goal:["muscle_gain","maintenance"],    prep:10, cook:20, serves:1, emoji:"🍛", desc:"Aromatic curry-spiced beef mince over coconut milk jasmine rice. Curry in a cuddle. Rich, warming and macro-balanced.", ings:[{id:9,amt:200},{id:34,amt:130},{id:153,amt:80},{id:106,amt:5},{id:80,amt:60}], method:["Cook jasmine rice with coconut milk instead of water.","Brown beef mince with curry powder, onion, garlic, ginger.","Add diced tomato and simmer 10 min.","Taste and adjust seasoning.","Plate coconut rice, top with curried mince. Finish with coriander."], tags:["Indian-Gulf","Comfort","Calorie Dense"]},
  {id:52, name:"Penne Primavera with Grilled Chicken",  cat:"Dinner",  goal:["muscle_gain","maintenance"],    prep:10, cook:20, serves:1, emoji:"🍝", desc:"Wholemeal penne with grilled chicken, seasonal vegetables, passata and fresh basil. Clean pasta that hits every macro.", ings:[{id:1,amt:180},{id:46,amt:120},{id:152,amt:100},{id:65,amt:80},{id:71,amt:80}], method:["Cook penne per instructions.","Grill chicken with olive oil and herbs, 6 min per side. Slice.","Sauté broccoli and capsicum in EVOO 3 min.","Add passata, simmer 5 min.","Toss pasta in sauce with vegetables and chicken. Fresh basil."], tags:["Pasta","Balanced","Meal Prep"]},
  {id:53, name:"Egg White Scramble on Sourdough",       cat:"Breakfast",goal:["fat_loss"],                    prep:5,  cook:8,  serves:1, emoji:"🍳", desc:"Silky egg white scramble with baby spinach, smoked salmon and lemon on toasted sourdough. Clean, lean and elegant.", ings:[{id:21,amt:180},{id:14,amt:80},{id:57,amt:60},{id:50,amt:80},{id:99,amt:30}], method:["Whisk egg whites with a pinch of salt and chilli flakes.","Wilt baby spinach in a pan, 1 min.","Add egg whites, scramble gently — remove while still glossy.","Toast sourdough until golden.","Top toast with scramble, smoked salmon, lemon and cherry tomatoes."], tags:["Low Calorie","High Protein","Omega-3"]},
  {id:54, name:"Beef Pesto Pasta",                      cat:"Dinner",  goal:["muscle_gain"],                  prep:10, cook:15, serves:1, emoji:"🍝", desc:"Lean beef mince with wholemeal pasta, basil pesto, cherry tomatoes and parmesan. Your new go-to high-protein pasta.", ings:[{id:9,amt:150},{id:46,amt:130},{id:69,amt:80},{id:119,amt:10},{id:147,amt:5}], method:["Cook wholemeal pasta per instructions.","Brown beef mince with garlic and season well.","Halve cherry tomatoes, sauté 2 min in the same pan.","Toss pasta with beef, tomatoes, pesto and pasta water.","Serve with fresh basil and a little parmesan."], tags:["High Protein","Pasta","Italian-Gulf"]},
  {id:55, name:"Banana Chia Overnight Oats",            cat:"Breakfast",goal:["longevity","fat_loss"],        prep:5,  cook:0,  serves:1, emoji:"🌾", desc:"Banana and chia seed overnight oats with walnuts and a pinch of cinnamon. 15g protein, slow-release energy, 5g fibre.", ings:[{id:39,amt:70},{id:105,amt:100},{id:125,amt:20},{id:123,amt:15},{id:104,amt:2}], method:["Slice banana and mash half into the jar.","Add oats, chia seeds and cinnamon.","Pour over 250ml almond milk and stir well.","Top with walnut pieces and banana slices.","Refrigerate overnight. Grab and go in the morning."], tags:["Meal Prep","Heart Healthy","Longevity"]},
];

// ─── Static data ────────────────────────────────────────────────────────────────
const GOALS = [
  {id:"fat_loss",    label:"Fat loss",    icon:"🔥", color:tk.red,    adj:-400},
  {id:"muscle_gain", label:"Muscle gain", icon:"💪", color:tk.blue,   adj:400},
  {id:"longevity",   label:"Longevity",   icon:"🌿", color:tk.teal,   adj:100},
  {id:"maintenance", label:"Maintenance", icon:"⚖️", color:tk.amber,  adj:0},
];
const ACTIVITY = [
  {id:"sedentary", label:"Sedentary",         desc:"Little or no exercise",          mult:1.2},
  {id:"light",     label:"Lightly active",    desc:"1–3 days per week",              mult:1.375},
  {id:"moderate",  label:"Moderately active", desc:"3–5 days per week",              mult:1.55},
  {id:"very",      label:"Very active",       desc:"6–7 days per week",              mult:1.725},
  {id:"extra",     label:"Extra active",      desc:"Physical job + double training", mult:1.9},
];
const WORKOUTS = [
  {day:"Day 1",focus:"Chest",        emoji:"💪",exs:[["Barbell Bench Press","12×3","70% 1RM","Medium grip"],["Incline Dumbbell Press","12×3","60–70%",""],["Decline Dumbbell Press","12×3","60–70%",""],["Dumbbell Flyes","12×3","60%",""],["Cable Crossover","12×3","60%",""]]},
  {day:"Day 2",focus:"Back",         emoji:"🏋️",exs:[["Barbell Deadlift","12×3","70% 1RM",""],["Pull Ups","12×3","BW+","Add weight if needed"],["Bent-Over Rows","12×3","60–70%","Reverse grip"],["One-Arm DB Row","12×3","60–70%",""],["Wide-Grip Lat Pull","12×3","70%",""]]},
  {day:"Day 3",focus:"Cardio & Abs", emoji:"🏃",exs:[["Treadmill Intervals","20 min","60–70% MHR","20s sprint / 40s walk"],["X-Trainer Intervals","10 min","60–70%","20s high / 40s low"],["Rower","2 min×3","Max","500m target"],["Front Plank","3×fail","Max","Elbows under shoulders"],["Mountain Climbers","20×3","","Alternate knees"]]},
  {day:"Day 4",focus:"Shoulders",    emoji:"🔱",exs:[["DB Shoulder Press","12×3","70% 1RM",""],["Arnold Press","12×3","70%",""],["Side Lateral Raise","12×3","60%",""],["Front DB Raise","12×3","60%",""],["Upright Barbell Row","12×3","70%",""]]},
  {day:"Day 5",focus:"Legs",         emoji:"🦵",exs:[["Barbell Squat","12×3","70% 1RM","Goblet if back issues"],["Leg Press","12×3","70%",""],["DB Front Lunge","12×3","70%",""],["Leg Extensions","12×3","70%",""],["Seated Leg Curl","12×3","70%",""],["Standing Calf Raise","12×3","70%",""]]},
  {day:"Day 6",focus:"Arms + Cardio",emoji:"💫",exs:[["Close-Grip Bench","12×3","70% 1RM",""],["Triceps Pushdown","12×3","70%","V-Bar attachment"],["Barbell Curl","12×3","70%",""],["Hammer Curl","12×3","70%","Alternate arms"],["Treadmill Intervals","20 min","60–70%","20s run / 40s walk"],["X-Trainer Intervals","10 min","60–70%",""]]},
];

// ─── Meal plan constants ─────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEAL_SLOTS = [
  {id:'breakfast', label:'Breakfast',        cat:'Breakfast', pct:0.22},
  {id:'snack1',    label:'Morning snack',    cat:'Snack',     pct:0.10},
  {id:'lunch',     label:'Lunch',            cat:'Lunch',     pct:0.25},
  {id:'snack2',    label:'Afternoon snack',  cat:'Snack',     pct:0.10},
  {id:'dinner',    label:'Dinner',           cat:'Dinner',    pct:0.28},
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function calcMacros(pro) {
  if (!pro.weight || !pro.height || !pro.age) return null;
  const w=+pro.weight, h=+pro.height, a=+pro.age;
  const bmr = pro.gender==="female" ? 655+(9.563*w)+(1.85*h)-(4.676*a) : 66+(13.75*w)+(5.003*h)-(6.75*a);
  const mult = ACTIVITY.find(x=>x.id===pro.activityLevel)?.mult||1.55;
  const tdee = Math.round(bmr*mult);
  const adj  = GOALS.find(x=>x.id===pro.goal)?.adj||0;
  const targetCal = tdee+adj;
  const proteinG  = Math.round(w*(pro.goal==="fat_loss"?2.2:2.0));
  const fatG      = Math.round((targetCal*0.25)/9);
  const carbG     = Math.round((targetCal-proteinG*4-fatG*9)/4);
  return {bmr:Math.round(bmr),tdee,targetCal,proteinG,carbG,fatG};
}
function ingMacros({id,amt}) {
  const ing=BASE_ING.find(i=>i.id===id);
  if(!ing) return {cal:0,p:0,c:0,f:0,fi:0};
  const r=amt/ing.ref;
  return {cal:ing.cal*r, p:ing.p*r, c:ing.c*r, f:ing.f*r, fi:ing.fi*r};
}
function recipeTotals(recipe) {
  let cal=0,p=0,c=0,f=0,fi=0;
  const ings = parseArr(recipe.ings);
  ings.forEach(ri=>{const m=ingMacros(ri);cal+=m.cal;p+=m.p;c+=m.c;f+=m.f;fi+=m.fi;});
  const s=recipe.serves||1;
  return {cal:Math.round(cal/s),p:Math.round(p/s),c:Math.round(c/s),f:Math.round(f/s),fi:Math.round(fi/s)};
}

const RECIPE_CATEGORIES = [
  {id:'high_performance', label:'High Performance', emoji:'🔥', color:'#1C1C1C', photo:'/cat-high-performance.jpg'},
  {id:'salads',           label:'Salads',           emoji:'🥗', color:'#2D5A27', photo:'/cat-salads.jpg'},
  {id:'chicken',          label:'Chicken',          emoji:'🍗', color:'#C47C0A', photo:'/cat-chicken.jpg'},
  {id:'fish',             label:'Fish & Seafood',   emoji:'🐟', color:'#1B6CA8', photo:'/cat-fish.jpg'},
  {id:'grills',           label:'Grills & Platters',emoji:'🍖', color:'#E8621A', photo:'/cat-grills.jpg'},
  {id:'breakfast',        label:'Breakfast',        emoji:'🍳', color:'#BA9A3C', photo:'/cat-breakfast.jpg'},
  {id:'soups',            label:'Soups & Broths',   emoji:'🥣', color:'#8B4513', photo:'/cat-soups.jpg'},
  {id:'plant',            label:'Plant Based',      emoji:'🌿', color:'#4A7C3F', photo:'/cat-plant.jpg'},
  {id:'pasta',            label:'Pasta & Rice',     emoji:'🍝', color:'#9E7B3C', photo:'/cat-pasta.jpg'},
  {id:'dips',             label:'Dips & Sides',     emoji:'🫙', color:'#7F77DD', photo:'/cat-dips.jpg'},
  {id:'mealprep',         label:'Meal Prep',        emoji:'🍱', color:'#1D9E75', photo:'/cat-mealprep.jpg'},
  {id:'lowcal',           label:'Low Calorie',      emoji:'⚡', color:'#378ADD', photo:'/cat-lowcal.jpg'},
];

const SECTION_TAGS = [
  {label:'Salad',             emoji:'🥗'},
  {label:'Chicken',           emoji:'🍗'},
  {label:'Fish & Seafood',    emoji:'🐟'},
  {label:'Grills & Platters', emoji:'🍖'},
  {label:'Dips & Sides',      emoji:'🫙'},
  {label:'Plant Based',       emoji:'🌿'},
  {label:'Pasta & Rice',      emoji:'🍝'},
  {label:'Bone Broth',        emoji:'🥣'},
  {label:'High Performance',  emoji:'⚡'},
  {label:'Fitness',           emoji:'🔥'},
  {label:'Middle Eastern',    emoji:'🌍'},
  {label:'Indian',            emoji:'🇮🇳'},
  {label:'Asian',             emoji:'🇯🇵'},
  {label:'Longevity',         emoji:'🫐'},
  {label:'Meal Prep',         emoji:'🍱'},
];

function getRecipesForCategory(cat, recipes) {
  switch(cat.id) {
    case 'high_performance': return recipes.filter(r=>parseArr(r.tags).includes('High Performance'));
    case 'salads':           return recipes.filter(r=>parseArr(r.tags).includes('Salad')||/salad/i.test(r.name));
    case 'chicken':          return recipes.filter(r=>parseArr(r.ings).some(i=>i.id===1||i.id===2)||parseArr(r.tags).includes('Chicken'));
    case 'fish':             return recipes.filter(r=>parseArr(r.ings).some(i=>[14,15,16,17,18,19].includes(i.id))||parseArr(r.tags).some(t=>['Omega-3','Fish','Gulf Fish','Seafood'].includes(t)));
    case 'grills':           return recipes.filter(r=>parseArr(r.tags).some(t=>t==='Fitness'||t==='High Protein'||t==='Grills & Platters')||/grill|platter|bowl/i.test(r.name));
    case 'breakfast':        return recipes.filter(r=>r.cat==='Breakfast'||parseArr(r.tags).includes('Breakfast'));
    case 'soups':            return recipes.filter(r=>parseArr(r.tags).some(t=>t==='Bone Broth'||t==='Soup')||/soup|broth/i.test(r.name));
    case 'plant':            return recipes.filter(r=>parseArr(r.tags).some(t=>['Plant Based','Vegan','Vegetarian'].includes(t)));
    case 'pasta':            return recipes.filter(r=>parseArr(r.ings).some(i=>i.id>=31&&i.id<=45)||/pasta|rice|noodle/i.test(r.name));
    case 'dips':             return recipes.filter(r=>/dip|hummus|sauce|salsa/i.test(r.name));
    case 'mealprep':         return recipes.filter(r=>parseArr(r.tags).includes('Meal Prep'));
    case 'lowcal':           return recipes.filter(r=>recipeTotals(r).cal<350);
    default:                 return recipes;
  }
}

function generateWeeklyPlan(client, recipes) {
  const subject={...client,age:String(client.age),weight:String(client.weight),height:String(client.height)};
  const m=calcMacros(subject);
  if(!m) return null;
  const valid=recipes.filter(r=>{
    const tot=recipeTotals(r);
    if(tot.cal===0) return false;
    if(tot.cal>900) return false;
    if(tot.p>120) return false;
    if(tot.cal<50&&!parseArr(r.tags).includes('Bone Broth')) return false;
    if(tot.c>200) return false;
    if(parseArr(r.tags).includes('Dips & Sides')) return false;
    return true;
  });
  const bySlot={};
  MEAL_SLOTS.forEach(slot=>{
    const all=valid.filter(r=>r.cat===slot.cat);
    const goalFirst=all.filter(r=>parseArr(r.goal).includes(client.goal));
    const rest=all.filter(r=>!parseArr(r.goal).includes(client.goal));
    bySlot[slot.id]=[...goalFirst,...rest];
  });
  const days=DAYS_OF_WEEK.map((day,di)=>({
    day, dayIdx:di,
    meals:MEAL_SLOTS.map((slot,si)=>{
      const pool=bySlot[slot.id];
      if(!pool.length) return {slotId:slot.id,recipeId:null};
      return {slotId:slot.id, recipeId:pool[(di*2+si*3)%pool.length].id};
    }),
  }));
  return {clientId:client.id, days, macros:m};
}

function buildShoppingList(plan, recipes, ingredients) {
  const totals={};
  plan.days.forEach(day=>{
    day.meals.forEach(meal=>{
      if(!meal.recipeId) return;
      const rec=recipes.find(r=>r.id===meal.recipeId);
      if(!rec) return;
      const serves=rec.serves||1;
      parseArr(rec.ings).forEach(ri=>{
        if(!totals[ri.id]) {
          const ing=ingredients.find(i=>i.id===ri.id);
          if(!ing) return;
          totals[ri.id]={id:ri.id,name:ing.name,cat:ing.cat,totalAmt:0,recipeNames:new Set()};
        }
        totals[ri.id].totalAmt+=ri.amt/serves;
        totals[ri.id].recipeNames.add(rec.name);
      });
    });
  });
  return Object.values(totals)
    .filter(x=>x.name)
    .map(x=>({...x,totalAmt:Math.round(x.totalAmt),recipeNames:[...x.recipeNames]}))
    .sort((a,b)=>a.cat.localeCompare(b.cat)||a.name.localeCompare(b.name));
}

// ─── Primitives ─────────────────────────────────────────────────────────────────
const crd = {background:"var(--color-background-primary)",border:tk.bd,borderRadius:tk.rLg,padding:20};
function Hdr({title,sub}) {
  return <div style={{marginBottom:20}}><h1 style={{fontSize:18,fontWeight:500,margin:"0 0 4px"}}>{title}</h1>{sub&&<p style={{fontSize:12,color:"var(--color-text-secondary)",margin:0}}>{sub}</p>}</div>;
}
function Stat({label,value,sub,color=tk.teal}) {
  return <div style={{background:"var(--color-background-secondary)",borderRadius:tk.r,padding:"14px 16px"}}><div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:500,color}}>{value}</div>{sub&&<div style={{fontSize:9,color:"var(--color-text-tertiary)",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{sub}</div>}</div>;
}
function Pill({text,color,bg}) {
  return <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:bg||color+"18",color:color||"var(--color-text-secondary)",fontWeight:500,whiteSpace:"nowrap"}}>{text}</span>;
}
function CatBadge({cat}) {
  return <Pill text={cat} color={CAT_C[cat]} bg={CAT_S[cat]}/>;
}

// ─── Recipe card ────────────────────────────────────────────────────────────────
function RecipeCard({recipe,onSelect,selected}) {
  const m=recipeTotals(recipe);
  const hasPhoto=!!recipe.photo_url;
  return (
    <div onClick={()=>onSelect(recipe)} style={{...crd,padding:0,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s,transform 0.15s",border:selected?`2px solid ${tk.teal}`:tk.bd}}
      onMouseEnter={e=>{if(!selected){e.currentTarget.style.borderColor="var(--color-border-secondary)";e.currentTarget.style.transform="translateY(-1px)";}}}
      onMouseLeave={e=>{if(!selected){e.currentTarget.style.borderColor="var(--color-border-tertiary)";e.currentTarget.style.transform="";}}}>
      {hasPhoto
        ? <img src={recipe.photo_url} alt={recipe.name} style={{width:"100%",height:160,objectFit:"cover",display:"block"}}/>
        : <div style={{height:72,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-background-secondary)",fontSize:32}}>{recipe.emoji}</div>
      }
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          {hasPhoto && <span style={{fontSize:16,marginRight:6}}>{recipe.emoji}</span>}
          <span style={{fontSize:10,color:"var(--color-text-tertiary)",padding:"2px 8px",background:"var(--color-background-secondary)",borderRadius:20,marginLeft:"auto"}}>{recipe.cat}</span>
        </div>
        <div style={{fontSize:13,fontWeight:500,lineHeight:1.3,marginBottom:4}}>{recipe.name}</div>
        <div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.5,marginBottom:10}}>{(recipe.desc||recipe.description||'').slice(0,72)}…</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
          {parseArr(recipe.tags).includes('High Performance')&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:'#2D2D2D',color:'#fff',fontWeight:600,letterSpacing:'0.03em'}}>⚡ High Performance</span>}
          {parseArr(recipe.tags).filter(t=>t!=='High Performance').slice(0,2).map(tag=><Pill key={tag} text={tag} color={tk.teal} bg={tk.tealSurf}/>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",paddingTop:10,borderTop:tk.bd}}>
          {[["kcal",m.cal,tk.teal],["P",m.p+"g",tk.blue],["C",m.c+"g",tk.green],["F",m.f+"g",tk.coral]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:500,color:c}}>{v}</div><div style={{fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>{l}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Recipe detail ──────────────────────────────────────────────────────────────
function RecipeDetail({recipe,onClose,onDelete,onUpdate,allIngredients=BASE_ING}) {
  if(!recipe) return null;

  // ── all hooks first ──────────────────────────────────────────────────────────
  const [localPhoto,setLocalPhoto]           = useState(recipe.photo_url||null);
  const [photoUploading,setPhotoUploading]   = useState(false);
  const [photoErr,setPhotoErr]               = useState(null);
  const [photoDragOver,setPhotoDragOver]     = useState(false);
  const [multiplier,setMultiplier]           = useState(1);
  const [customQty,setCustomQty]             = useState('');
  const photoInputRef = useRef(null);

  const [editMode,setEditMode]               = useState(false);
  const [draft,setDraft]                     = useState(null);
  const [editIngs,setEditIngs]               = useState([]);
  const [editMethod,setEditMethod]           = useState([]);
  const [editTagInput,setEditTagInput]       = useState('');
  const [editIngSearch,setEditIngSearch]     = useState('');
  const [editIngEditIdx,setEditIngEditIdx]   = useState(null);
  const [editIngQuery,setEditIngQuery]       = useState('');
  const [editSaving,setEditSaving]           = useState(false);
  const [editSaved,setEditSaved]             = useState(false);
  const [editErr,setEditErr]                 = useState('');

  const editTotals = useMemo(()=>{
    let cal=0,p=0,c=0,f=0;
    editIngs.forEach(ri=>{const mx=ingMacros(ri);cal+=mx.cal;p+=mx.p;c+=mx.c;f+=mx.f;});
    const s=+(draft?.serves)||1;
    return {cal:Math.round(cal/s),p:Math.round(p/s),c:Math.round(c/s),f:Math.round(f/s)};
  },[editIngs,draft?.serves]);

  const editIngFiltered = useMemo(()=>{
    if(!editIngSearch||editIngSearch.length<2) return [];
    const q=editIngSearch.toLowerCase();
    return allIngredients.filter(i=>i.name.toLowerCase().includes(q)||i.sub.toLowerCase().includes(q)).slice(0,10);
  },[editIngSearch,allIngredients]);

  const editIngQueryFiltered = useMemo(()=>{
    if(!editIngQuery||editIngQuery.length<1) return [];
    const q=editIngQuery.toLowerCase();
    return allIngredients.filter(i=>i.name.toLowerCase().includes(q)).slice(0,10);
  },[editIngQuery,allIngredients]);

  // ── view-mode computed ───────────────────────────────────────────────────────
  const ings   = parseArr(recipe.ings);
  const tags   = parseArr(recipe.tags);
  const method = parseArr(recipe.method);
  const goal   = parseArr(recipe.goal);
  const safeRecipe = {...recipe, ings, tags, method, goal};
  const m=recipeTotals(safeRecipe);
  const resolved=ings.map(ri=>{const ing=BASE_ING.find(i=>i.id===ri.id);if(!ing)return null;return {...ing,amt:ri.amt,mx:ingMacros(ri)};}).filter(Boolean);
  const hasPhoto = !!localPhoto;

  // ── edit helpers ─────────────────────────────────────────────────────────────
  function startEdit() {
    setDraft({
      name:  recipe.name||'',
      desc:  recipe.desc||recipe.description||'',
      cat:   recipe.cat||'Lunch',
      emoji: recipe.emoji||'🍽️',
      prep:  recipe.prep??0,
      cook:  recipe.cook??0,
      serves:recipe.serves??1,
      goal:  [...parseArr(recipe.goal)],
      tags:  [...parseArr(recipe.tags)],
    });
    setEditIngs([...parseArr(recipe.ings)]);
    const m0=parseArr(recipe.method);
    setEditMethod(m0.length?[...m0]:['']);
    setEditMode(true);
    setEditErr('');setEditSaved(false);setEditIngSearch('');setEditTagInput('');
  }
  function isDirty() {
    if(!draft) return false;
    const ob=JSON.stringify({name:recipe.name||'',desc:recipe.desc||recipe.description||'',cat:recipe.cat||'',emoji:recipe.emoji||'',prep:recipe.prep??0,cook:recipe.cook??0,serves:recipe.serves??1});
    const cb=JSON.stringify({name:draft.name,desc:draft.desc,cat:draft.cat,emoji:draft.emoji,prep:draft.prep,cook:draft.cook,serves:draft.serves});
    if(ob!==cb) return true;
    if(JSON.stringify(parseArr(recipe.ings))!==JSON.stringify(editIngs)) return true;
    if(JSON.stringify(parseArr(recipe.method))!==JSON.stringify(editMethod.filter(s=>s.trim()))) return true;
    if(JSON.stringify([...parseArr(recipe.goal)].sort())!==JSON.stringify([...(draft.goal||[])].sort())) return true;
    if(JSON.stringify([...parseArr(recipe.tags)].sort())!==JSON.stringify([...(draft.tags||[])].sort())) return true;
    return false;
  }
  function cancelEdit() {
    if(isDirty()&&!window.confirm('Discard unsaved changes?')) return;
    setEditMode(false);setDraft(null);setEditIngs([]);setEditMethod([]);
    setEditIngSearch('');setEditIngEditIdx(null);setEditIngQuery('');setEditTagInput('');setEditErr('');
  }
  async function saveEdit() {
    if(!draft.name.trim()){setEditErr('Recipe name is required.');return;}
    if(editIngs.length===0){setEditErr('At least one ingredient is required.');return;}
    setEditErr('');setEditSaving(true);
    const updates={
      name:draft.name.trim(),desc:draft.desc,cat:draft.cat,emoji:draft.emoji,
      prep:+draft.prep||0,cook:+draft.cook||0,serves:+draft.serves||1,
      goal:draft.goal,ings:editIngs,method:editMethod.filter(s=>s.trim()),tags:draft.tags,
    };
    try {
      const {error}=await supabase.from('recipes').update(updates).eq('id',recipe.id);
      if(error) throw error;
      if(onUpdate) onUpdate({...recipe,...updates});
      setEditSaved(true);
      setTimeout(()=>{setEditSaved(false);setEditMode(false);},2000);
    } catch(e){setEditErr('Save failed: '+(e.message||'unknown'));}
    finally{setEditSaving(false);}
  }

  function fmtAmt(g) {
    const t=Math.round(g);
    return t>=1000?(t/1000).toFixed(t%1000===0?0:1)+'kg':t+'g';
  }
  async function quickSave(patch) {
    if(onUpdate) onUpdate({...recipe,...patch});
    try { await supabase.from('recipes').update(patch).eq('id',recipe.id); } catch(e){}
  }

  async function handlePhotoFile(file) {
    if(!file) return;
    const allowed=['image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type)){setPhotoErr('Only JPG, PNG or WebP accepted.');return;}
    if(file.size>5*1024*1024){setPhotoErr('File must be under 5 MB.');return;}
    setPhotoErr(null);
    setPhotoUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `recipe-${recipe.id}-${Date.now()}.${ext}`;
      const {error:upErr} = await supabase.storage.from('recipe-images').upload(path,file,{upsert:true,contentType:file.type});
      if(upErr) throw upErr;
      const {data:{publicUrl}} = supabase.storage.from('recipe-images').getPublicUrl(path);
      const {error:dbErr} = await supabase.from('recipes').update({photo_url:publicUrl}).eq('id',recipe.id);
      if(dbErr) throw dbErr;
      setLocalPhoto(publicUrl);
      if(onUpdate) onUpdate({...recipe,photo_url:publicUrl});
    } catch(e) {
      setPhotoErr('Upload failed: '+(e.message||'unknown error'));
    } finally {
      setPhotoUploading(false);
    }
  }

  // ── shared style shortcuts ────────────────────────────────────────────────────
  const eInp={width:"100%",boxSizing:"border-box",padding:"9px 12px",border:"1px solid #cccccc",borderRadius:tk.r,fontSize:13,background:"var(--color-background-primary)",color:"var(--color-text-primary)",outline:"none"};
  const eLbl={fontSize:12,color:"#4A4A4A",display:"block",marginBottom:5,fontWeight:500};

  // ── EDIT MODE RENDER ──────────────────────────────────────────────────────────
  if(editMode && draft) return (
    <div style={{marginTop:16,...crd,borderRadius:tk.rXl,padding:0,overflow:"hidden"}}>
      {/* toolbar */}
      <div style={{padding:"12px 20px",display:"flex",gap:8,alignItems:"center",borderBottom:tk.bd,background:"var(--color-background-secondary)"}}>
        <button onClick={cancelEdit} style={{padding:"6px 14px",borderRadius:40,fontSize:13,fontWeight:500,cursor:"pointer",background:"white",color:tk.gray,border:`1px solid ${tk.gray}`,whiteSpace:"nowrap"}}>← Back</button>
        <span style={{fontSize:14,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>✏️ Editing: {recipe.name}</span>
      </div>

      {/* live macro bar */}
      <div style={{padding:"12px 20px",background:"#F7F4EF",borderBottom:tk.bd}}>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:editTotals.cal>0?6:0}}>
          <span style={{fontSize:11,fontWeight:600,color:"#555",marginRight:2}}>Live total:</span>
          <span style={{fontSize:14,fontWeight:700,color:tk.teal}}>{editTotals.cal} kcal</span>
          <span style={{color:"#ccc"}}>·</span>
          <span style={{fontSize:13,fontWeight:600,color:tk.blue}}>{editTotals.p}g P</span>
          <span style={{color:"#ccc"}}>·</span>
          <span style={{fontSize:13,fontWeight:600,color:tk.amber}}>{editTotals.c}g C</span>
          <span style={{color:"#ccc"}}>·</span>
          <span style={{fontSize:13,fontWeight:600,color:tk.coral}}>{editTotals.f}g F</span>
        </div>
        {editTotals.cal>0&&(
          <div style={{height:5,borderRadius:3,background:"#E8E4DC",overflow:"hidden",display:"flex"}}>
            {[[editTotals.p*4,tk.blue],[editTotals.c*4,tk.amber],[editTotals.f*9,tk.coral]].map(([kcal,col],idx)=>(
              <div key={idx} style={{width:Math.min(100,Math.round(kcal/editTotals.cal*100))+'%',height:'100%',background:col,transition:'width 0.2s'}}/>
            ))}
          </div>
        )}
      </div>

      <div style={{padding:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>

          {/* ── LEFT: basic info + goals + tags + method ─────────────────── */}
          <div>
            <div style={{marginBottom:12}}>
              <label style={eLbl}>Recipe name *</label>
              <input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} style={eInp} placeholder="Recipe name…"/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={eLbl}>Description</label>
              <textarea value={draft.desc} onChange={e=>setDraft(d=>({...d,desc:e.target.value}))} rows={3} style={{...eInp,resize:"vertical"}} placeholder="Short description…"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={eLbl}>Category</label>
                <select value={draft.cat} onChange={e=>setDraft(d=>({...d,cat:e.target.value}))} style={eInp}>
                  {["Breakfast","Lunch","Dinner","Snack"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={eLbl}>Emoji</label>
                <input value={draft.emoji} onChange={e=>setDraft(d=>({...d,emoji:e.target.value}))} style={eInp} maxLength={4} placeholder="🍽️"/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              {[["Prep (min)","prep"],["Cook (min)","cook"],["Serves","serves"]].map(([l,k])=>(
                <div key={k}><label style={eLbl}>{l}</label><input type="number" min={0} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))} style={eInp}/></div>
              ))}
            </div>
            <div style={{marginBottom:12}}>
              <label style={eLbl}>Goals</label>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {GOALS.map(g=>(
                  <label key={g.id} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:13,color:"#4A4A4A"}}>
                    <input type="checkbox" checked={(draft.goal||[]).includes(g.id)}
                      onChange={e=>setDraft(d=>({...d,goal:e.target.checked?[...(d.goal||[]),g.id]:(d.goal||[]).filter(x=>x!==g.id)}))}/>
                    {g.icon} {g.label}
                  </label>
                ))}
              </div>
            </div>

            {/* tags */}
            <div style={{marginBottom:16}}>
              <label style={eLbl}>Tags</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8,minHeight:28}}>
                {(draft.tags||[]).map((tag,i)=>(
                  <span key={i} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 10px",borderRadius:20,background:tk.tealSurf,color:tk.tealText,fontSize:12,fontWeight:500}}>
                    {tag}
                    <button onClick={()=>setDraft(d=>({...d,tags:d.tags.filter((_,j)=>j!==i)}))}
                      style={{background:"none",border:"none",cursor:"pointer",color:tk.teal,fontSize:14,lineHeight:1,padding:"0 1px",marginLeft:2}}>×</button>
                  </span>
                ))}
              </div>
              <div style={{display:"flex",gap:6}}>
                <input value={editTagInput} onChange={e=>setEditTagInput(e.target.value)}
                  onKeyDown={e=>{if((e.key==='Enter'||e.key===',')&&editTagInput.trim()){e.preventDefault();const t=editTagInput.trim().replace(/,$/,'');if(t&&!(draft.tags||[]).includes(t)){setDraft(d=>({...d,tags:[...(d.tags||[]),t]}));setEditTagInput('');}}}}
                  placeholder="New tag… (Enter to add)" style={{...eInp,flex:1}}/>
                <button onClick={()=>{const t=editTagInput.trim();if(t&&!(draft.tags||[]).includes(t)){setDraft(d=>({...d,tags:[...(d.tags||[]),t]}));setEditTagInput('');}}}
                  style={{padding:"0 14px",borderRadius:tk.r,border:`1px solid ${tk.teal}`,color:tk.teal,background:"transparent",cursor:"pointer",fontSize:18,fontWeight:600,flexShrink:0}}>+</button>
              </div>
            </div>

            {/* method steps */}
            <div>
              <label style={eLbl}>Method steps</label>
              {editMethod.map((step,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:2,paddingTop:11}}>
                    <button disabled={i===0} onClick={()=>setEditMethod(arr=>{const a=[...arr];[a[i-1],a[i]]=[a[i],a[i-1]];return a;})}
                      style={{width:20,height:20,border:"1px solid #ccc",borderRadius:4,cursor:i===0?"not-allowed":"pointer",fontSize:10,background:"white",color:i===0?"#ccc":"#444",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>↑</button>
                    <button disabled={i===editMethod.length-1} onClick={()=>setEditMethod(arr=>{const a=[...arr];[a[i+1],a[i]]=[a[i],a[i+1]];return a;})}
                      style={{width:20,height:20,border:"1px solid #ccc",borderRadius:4,cursor:i===editMethod.length-1?"not-allowed":"pointer",fontSize:10,background:"white",color:i===editMethod.length-1?"#ccc":"#444",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>↓</button>
                  </div>
                  <span style={{width:22,height:22,borderRadius:"50%",background:tk.tealSurf,color:tk.tealText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,flexShrink:0,marginTop:11}}>{i+1}</span>
                  <textarea value={step} onChange={e=>setEditMethod(arr=>arr.map((s,j)=>j===i?e.target.value:s))}
                    placeholder={`Step ${i+1}…`} rows={2} style={{...eInp,flex:1,resize:"vertical"}}/>
                  {editMethod.length>1&&<button onClick={()=>setEditMethod(arr=>arr.filter((_,j)=>j!==i))}
                    style={{padding:"0 8px",height:44,cursor:"pointer",fontSize:18,color:tk.red,border:"none",background:"transparent",marginTop:2,flexShrink:0}}>×</button>}
                </div>
              ))}
              <button onClick={()=>setEditMethod(arr=>[...arr,''])}
                style={{fontSize:12,padding:"7px 14px",cursor:"pointer",color:tk.teal,marginTop:4,border:`1px solid ${tk.teal}`,borderRadius:tk.r,background:"transparent",fontWeight:500}}>+ Add step</button>
            </div>
          </div>

          {/* ── RIGHT: ingredient editor ─────────────────────────────────── */}
          <div>
            <label style={eLbl}>Add ingredient</label>
            <div style={{position:"relative",marginBottom:12}}>
              <input value={editIngSearch} onChange={e=>setEditIngSearch(e.target.value)}
                placeholder="Search ingredients to add…" style={eInp}/>
              {editIngFiltered.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--color-background-primary)",border:"1px solid #ccc",borderRadius:tk.r,zIndex:10,maxHeight:220,overflowY:"auto",marginTop:4,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
                  {editIngFiltered.map(ing=>(
                    <div key={ing.id}
                      onMouseDown={()=>{if(!editIngs.find(x=>x.id===ing.id)) setEditIngs(p=>[...p,{id:ing.id,amt:ing.ref||100}]);setEditIngSearch('');}}
                      style={{padding:"9px 14px",borderBottom:tk.bd,cursor:"pointer",display:"flex",justifyContent:"space-between",fontSize:12,alignItems:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--color-background-secondary)"}
                      onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <div><span style={{fontWeight:500}}>{ing.name}</span><span style={{marginLeft:6}}><CatBadge cat={ing.cat}/></span></div>
                      <span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{ing.cal} kcal/{ing.ref}g</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editIngs.length>0?(
              <div style={{border:"1px solid #ccc",borderRadius:tk.rLg,overflow:"visible",marginBottom:8}}>
                <div style={{padding:"7px 14px",background:"var(--color-background-secondary)",fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.08em",borderRadius:`${tk.rLg} ${tk.rLg} 0 0`}}>
                  Ingredient · click name to change &nbsp;|&nbsp; Amount (g) &nbsp;|&nbsp; ×
                </div>
                {editIngs.map((ri,i)=>{
                  const ing=allIngredients.find(x=>x.id===ri.id)||BASE_ING.find(x=>x.id===ri.id);
                  if(!ing) return null;
                  const mx=ingMacros(ri);
                  const inSearch=editIngEditIdx===i;
                  return (
                    <div key={i} style={{padding:"8px 14px",borderTop:"1px solid #ccc",display:"grid",gridTemplateColumns:"1fr 80px 32px",alignItems:"center",gap:8,position:"relative"}}>
                      {inSearch?(
                        <div style={{position:"relative"}}>
                          <input autoFocus value={editIngQuery}
                            onChange={e=>setEditIngQuery(e.target.value)}
                            onBlur={()=>{setEditIngEditIdx(null);setEditIngQuery('');}}
                            placeholder="Search ingredient…" style={{...eInp,padding:"5px 8px",fontSize:12}}/>
                          {editIngQueryFiltered.length>0&&(
                            <div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--color-background-primary)",border:"1px solid #ccc",borderRadius:tk.r,zIndex:30,maxHeight:180,overflowY:"auto",marginTop:2,boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
                              {editIngQueryFiltered.map(ni=>(
                                <div key={ni.id}
                                  onMouseDown={()=>{setEditIngs(p=>p.map((x,j)=>j===i?{...x,id:ni.id}:x));setEditIngEditIdx(null);setEditIngQuery('');}}
                                  style={{padding:"8px 12px",borderBottom:tk.bd,cursor:"pointer",fontSize:12}}
                                  onMouseEnter={e=>e.currentTarget.style.background="var(--color-background-secondary)"}
                                  onMouseLeave={e=>e.currentTarget.style.background=""}>
                                  {ni.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ):(
                        <div onClick={()=>{setEditIngEditIdx(i);setEditIngQuery('');}} style={{cursor:"pointer",display:"flex",flexDirection:"column",gap:1}}>
                          <span style={{fontSize:12,fontWeight:500,color:tk.teal,textDecoration:"underline dotted"}}>{ing.name}</span>
                          <span style={{fontSize:10,color:"var(--color-text-secondary)"}}>{Math.round(mx.cal)} kcal · <span style={{color:tk.blue}}>{Math.round(mx.p)}P</span> · <span style={{color:tk.amber}}>{Math.round(mx.c)}C</span> · <span style={{color:tk.coral}}>{Math.round(mx.f)}F</span></span>
                        </div>
                      )}
                      <input type="number" min={1} max={2000} value={ri.amt}
                        onChange={e=>setEditIngs(p=>p.map((x,j)=>j===i?{...x,amt:+e.target.value||0}:x))}
                        style={{...eInp,padding:"6px 8px",textAlign:"center"}}/>
                      <button onClick={()=>setEditIngs(p=>p.filter((_,j)=>j!==i))}
                        style={{height:32,cursor:"pointer",fontSize:18,color:tk.red,border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{border:"2px dashed #ccc",borderRadius:tk.rLg,padding:"24px",textAlign:"center",color:"var(--color-text-tertiary)",fontSize:13,marginBottom:12}}>
                Search and add ingredients above
              </div>
            )}
          </div>
        </div>

        {/* save / cancel */}
        {editErr&&<div style={{marginTop:16,padding:"10px 14px",background:"#FEF0F0",borderRadius:tk.r,fontSize:13,color:tk.red,fontWeight:500}}>{editErr}</div>}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={saveEdit} disabled={editSaving||editSaved}
            style={{flex:1,height:48,background:editSaved?"#4A7C3F":"#E8621A",color:"white",border:"none",borderRadius:tk.rLg,cursor:editSaving||editSaved?"default":"pointer",fontSize:15,fontWeight:600,transition:"background 0.2s"}}>
            {editSaving?"Saving…":editSaved?"Recipe saved ✓":"Save changes"}
          </button>
          <button onClick={cancelEdit}
            style={{padding:"0 24px",height:48,border:"1px solid #ccc",borderRadius:tk.rLg,cursor:"pointer",fontSize:14,background:"white",color:"#4A4A4A",fontWeight:500}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // ── VIEW MODE ─────────────────────────────────────────────────────────────────
  function handlePrint() {
    const benefitsHtml = resolved.map(ing=>
      `<div style="margin-bottom:12px;page-break-inside:avoid">
        <div style="font-weight:600;font-size:12px;margin-bottom:4px">${ing.name}</div>
        ${ing.benefits.slice(0,3).map(b=>`<div style="font-size:11px;color:#555;margin-bottom:2px">✓ ${b}</div>`).join('')}
      </div>`
    ).join('');
    const ingsHtml = resolved.map(ing=>
      `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:12px">
        <span><strong>${ing.name}</strong> <span style="color:#888">${ing.amt}g</span></span>
        <span style="color:#666">${Math.round(ing.mx.cal)} kcal · <span style="color:#4A7C3F">${Math.round(ing.mx.p)}P</span></span>
      </div>`
    ).join('');
    const methodHtml=(()=>{let n=0;return method.map(step=>{if(/^\[.+\]$/.test(step.trim()))return`<div style="font-size:11px;font-weight:600;color:#1A3A15;margin:14px 0 6px;text-transform:uppercase;letter-spacing:0.05em">${step.replace(/^\[|\]$/g,'')}</div>`;n++;return`<div style="display:flex;gap:10px;margin-bottom:10px;font-size:12px;align-items:flex-start"><span style="min-width:22px;height:22px;border-radius:50%;background:#FDEEE6;color:#7A2B07;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0">${n}</span><span style="color:#444;line-height:1.6">${step}</span></div>`;}).join('');})();
    const w = window.open('','_blank','width=800,height=900');
    w.document.write(`<!DOCTYPE html><html><head><title>${recipe.name} — Burnt Calories</title>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:32px 24px;color:#1a1a1a}
        h1{font-size:24px;margin:0 0 4px}
        .meta{font-size:12px;color:#888;margin-bottom:20px}
        .macros{display:grid;grid-template-columns:repeat(5,1fr);background:#f7f4f0;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center}
        .macros .val{font-size:20px;font-weight:600}
        .macros .lbl{font-size:10px;color:#888;margin-top:3px}
        .cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}
        h3{font-size:13px;font-weight:600;margin:0 0 12px;color:#333}
        .logo{margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#999}
        .logo strong{color:#E8621A}
        @media print{body{padding:16px}button{display:none}}
      </style>
    </head><body>
      ${localPhoto?`<img src="${localPhoto}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:20px;display:block"/>`:
        `<div style="font-size:48px;text-align:center;margin-bottom:12px">${recipe.emoji}</div>`}
      <h1>${recipe.name}</h1>
      <div class="meta">${recipe.cat} · ${recipe.prep} min prep · ${recipe.cook} min cook · serves ${recipe.serves}${tags.length?` · ${tags.join(', ')}`:''}
      </div>
      <div class="macros">
        ${[['Calories',m.cal,''],['Protein',m.p,'g'],['Carbs',m.c,'g'],['Fat',m.f,'g'],['Fibre',m.fi,'g']].map(([l,v,u])=>
          `<div><div class="val">${v}${u}</div><div class="lbl">${l}</div></div>`).join('')}
      </div>
      <div class="cols">
        <div>
          <h3>Ingredients</h3>${ingsHtml}
          <h3 style="margin-top:20px">Method</h3>${methodHtml}
        </div>
        <div><h3>Health Benefits</h3>${benefitsHtml}</div>
      </div>
      <div class="logo"><strong>Burnt Calories</strong> — Nutrition &amp; Performance · burntcalories.com</div>
      <div style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 24px;background:#E8621A;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">Print / Save PDF</button></div>
    </body></html>`);
    w.document.close();
  }
  return (
    <div style={{marginTop:16,...crd,borderRadius:tk.rXl,padding:0,overflow:"hidden"}}>
      {/* Photo zone */}
      {hasPhoto ? (
        <div style={{position:"relative",width:"100%",height:240,cursor:"pointer"}} onClick={()=>photoInputRef.current?.click()}
          onMouseEnter={e=>e.currentTarget.querySelector('.photo-overlay').style.opacity=1}
          onMouseLeave={e=>e.currentTarget.querySelector('.photo-overlay').style.opacity=0}>
          <img src={localPhoto} alt={recipe.name} style={{width:"100%",height:240,objectFit:"cover",display:"block"}}/>
          <div className="photo-overlay" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}}>
            <span style={{color:"#fff",fontSize:13,fontWeight:500,background:"rgba(0,0,0,0.5)",padding:"8px 16px",borderRadius:20}}>
              {photoUploading?"Uploading…":"📷 Change photo"}
            </span>
          </div>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>handlePhotoFile(e.target.files?.[0])}/>
        </div>
      ) : (
        <div
          onClick={()=>!photoUploading&&photoInputRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setPhotoDragOver(true);}}
          onDragLeave={()=>setPhotoDragOver(false)}
          onDrop={e=>{e.preventDefault();setPhotoDragOver(false);handlePhotoFile(e.dataTransfer.files?.[0]);}}
          style={{margin:"0 20px",borderRadius:tk.r,border:`2px dashed ${photoDragOver?"#E8621A":"#cccccc"}`,background:photoDragOver?"#FDEEE6":"var(--color-background-secondary)",padding:"28px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:photoUploading?"default":"pointer",transition:"all 0.15s",marginBottom:4}}>
          {photoUploading ? (
            <><span style={{fontSize:22}}>⏳</span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Uploading…</span></>
          ) : (
            <><span style={{fontSize:22}}>📷</span><span style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>Add recipe photo</span><span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Click or drag and drop · JPG, PNG, WebP · max 5 MB</span></>
          )}
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>handlePhotoFile(e.target.files?.[0])}/>
        </div>
      )}
      {photoErr&&<div style={{margin:"6px 20px 0",fontSize:12,color:"#c00"}}>{photoErr}</div>}
      <div style={{padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            {!hasPhoto && <span style={{fontSize:32}}>{recipe.emoji}</span>}
            <h2 style={{fontSize:18,fontWeight:500,margin:hasPhoto?"0 0 2px":"8px 0 2px"}}>{recipe.name}</h2>
            <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{recipe.cat} · {recipe.prep} min prep · {recipe.cook} min cook · serves {recipe.serves}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={handlePrint} style={{padding:"6px 12px",borderRadius:tk.r,cursor:"pointer",fontSize:12,background:tk.tealSurf,color:tk.tealText,border:`1px solid rgba(232,98,26,0.22)`}}>🖨 Print</button>
            <button onClick={startEdit} style={{padding:"6px 14px",borderRadius:40,cursor:"pointer",fontSize:12,background:"white",color:"#2D5A27",border:"1px solid #2D5A27",fontWeight:500}}>✏️ Edit recipe</button>
            {onDelete&&<button onClick={()=>onDelete(recipe.id)} style={{padding:"6px 12px",borderRadius:tk.r,cursor:"pointer",fontSize:12,color:tk.red}}>Delete</button>}
          </div>
        </div>
        <p style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.6,marginBottom:16}}>{recipe.desc}</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{tags.map(tag=><Pill key={tag} text={tag} color={tk.teal} bg={tk.tealSurf}/>)}</div>
        {multiplier>1&&<div style={{textAlign:"center",fontSize:11,fontWeight:500,color:tk.teal,marginBottom:4}}>Total for {multiplier} serving{multiplier!==1?"s":""}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",background:"var(--color-background-secondary)",borderRadius:tk.rLg,padding:"16px 12px",marginBottom:16}}>
          {[["Calories",Math.round(m.cal*multiplier),""],["Protein",Math.round(m.p*multiplier),"g"],["Carbs",Math.round(m.c*multiplier),"g"],["Fat",Math.round(m.f*multiplier),"g"],["Fibre",Math.round(m.fi*multiplier),"g"]].map(([l,v,u])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:500}}>{v}{u}</div><div style={{fontSize:10,color:"var(--color-text-secondary)",marginTop:3}}>{l}</div></div>
          ))}
        </div>

        {/* Serving multiplier */}
        <div style={{marginBottom:20,padding:"12px 14px",background:"var(--color-background-secondary)",borderRadius:tk.r}}>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:8,fontWeight:500}}>Serving multiplier</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            {[1,2,5,10,20,50,100].map(n=>(
              <button key={n} onClick={()=>{setMultiplier(n);setCustomQty('');}}
                style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${multiplier===n?tk.teal:"#C0DD97"}`,background:multiplier===n?tk.teal:"transparent",color:multiplier===n?"white":tk.teal,fontSize:12,fontWeight:multiplier===n?600:400,cursor:"pointer",transition:"all 0.12s"}}>
                {n}×
              </button>
            ))}
            <input type="number" min={1} value={customQty}
              onChange={e=>{setCustomQty(e.target.value);const v=+e.target.value;if(v>=1)setMultiplier(v);}}
              placeholder="Custom qty"
              style={{width:96,padding:"5px 10px",borderRadius:20,border:"1px solid #C0DD97",fontSize:12,outline:"none",background:"var(--color-background-primary)"}}/>
          </div>
        </div>

        {/* ── Category quick-edit ── */}
        <div style={{marginBottom:20,padding:"14px 16px",background:"var(--color-background-secondary)",borderRadius:tk.r}}>
          <div style={{fontSize:11,fontWeight:700,color:"#2D5A27",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Meal category</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {["Breakfast","Lunch","Dinner","Snack"].map(c=>{
              const active=recipe.cat===c;
              return <button key={c} onClick={()=>quickSave({cat:c})}
                style={{padding:"7px 16px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${active?"#2D5A27":"#ccc"}`,fontWeight:active?600:400,background:active?"#2D5A27":"transparent",color:active?"white":"var(--color-text-secondary)",transition:"all 0.1s"}}>{c}</button>;
            })}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:"#2D5A27",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Section tags</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {SECTION_TAGS.map(({label,emoji})=>{
              const active=parseArr(recipe.tags).includes(label);
              return <button key={label} onClick={()=>{
                const cur=parseArr(recipe.tags);
                quickSave({tags:active?cur.filter(t=>t!==label):[...cur,label]});
              }} style={{padding:"5px 11px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${active?"#2D5A27":"#ccc"}`,background:active?"#EAF3DE":"transparent",color:active?"#2D5A27":"var(--color-text-secondary)",fontWeight:active?500:400,transition:"all 0.1s"}}>
                {emoji} {label}
              </button>;
            })}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:"#2D5A27",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Goals</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {GOALS.map(g=>{
              const active=parseArr(recipe.goal).includes(g.id);
              return <button key={g.id} onClick={()=>{
                const cur=parseArr(recipe.goal);
                quickSave({goal:active?cur.filter(x=>x!==g.id):[...cur,g.id]});
              }} style={{padding:"5px 11px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${active?"#E8621A":"#ccc"}`,background:active?"#FDEEE6":"transparent",color:active?"#E8621A":"var(--color-text-secondary)",fontWeight:active?500:400,transition:"all 0.1s"}}>
                {g.icon} {g.label}
              </button>;
            })}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          <div>
            <h3 style={{fontSize:13,fontWeight:500,marginBottom:12}}>Ingredients</h3>
            {resolved.map((ing,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:tk.bd,fontSize:12}}>
                <div><span style={{fontWeight:500}}>{ing.name}</span><span style={{color:"var(--color-text-tertiary)",marginLeft:6}}>{fmtAmt(ing.amt*multiplier)}</span></div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{Math.round(ing.mx.cal*multiplier)} kcal · <span style={{color:tk.blue}}>{Math.round(ing.mx.p*multiplier)}P</span></div>
              </div>
            ))}
            <h3 style={{fontSize:13,fontWeight:500,margin:"20px 0 12px"}}>Method</h3>
            {(()=>{let n=0;return method.map((step,i)=>{const isSec=/^\[.+\]$/.test(step.trim());if(isSec)return(<div key={i} style={{fontSize:11,fontWeight:600,color:tk.tealText,margin:"14px 0 6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{step.replace(/^\[|\]$/g,'')}</div>);n++;return(<div key={i} style={{display:"flex",gap:10,marginBottom:10,fontSize:12}}><span style={{width:20,height:20,borderRadius:"50%",background:tk.tealSurf,color:tk.tealText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,flexShrink:0}}>{n}</span><span style={{color:"var(--color-text-secondary)",lineHeight:1.6}}>{step}</span></div>);});})()}
          </div>
          <div>
            <h3 style={{fontSize:13,fontWeight:500,marginBottom:12}}>Health benefits</h3>
            {resolved.map((ing,i)=>(
              <div key={i} style={{background:"var(--color-background-secondary)",borderRadius:tk.r,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:500,marginBottom:6}}>{ing.name}</div>
                {ing.benefits.slice(0,3).map((b,bi)=>(
                  <div key={bi} style={{fontSize:10,color:"var(--color-text-secondary)",display:"flex",gap:6,marginBottom:3}}>
                    <span style={{color:tk.teal,flexShrink:0}}>✓</span>{b}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Upload Form ─────────────────────────────────────────────────────────
const EMOJIS = ["🥣","🥗","🍖","🐟","🍳","🥩","🍲","🌾","🥤","🍦","🍱","🥣","🌯","🥞","🍚","🫙","🍝","🥘","🫕","🥙","🌮","🍜","🫐","🍱","🧆"];

function RecipeUploader({onSave,onClose,ingredients=BASE_ING}) {
  const [form,setForm] = useState({name:"",cat:"Breakfast",goal:["muscle_gain"],prep:10,cook:15,serves:1,emoji:"🥗",desc:"",tags:""});
  const [ings,setIngs] = useState([]);
  const [method,setMethod] = useState([""]);
  const [search,setSearch] = useState("");
  const [saved,setSaved] = useState(false);
  const [photoFile,setPhotoFile] = useState(null);
  const [photoPreview,setPhotoPreview] = useState(null);
  const [uploading,setUploading] = useState(false);
  const [dragOver,setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const totals = useMemo(()=>{
    let cal=0,p=0,c=0,f=0,fi=0;
    ings.forEach(ri=>{const m=ingMacros(ri);cal+=m.cal;p+=m.p;c+=m.c;f+=m.f;fi+=m.fi;});
    const s=form.serves||1;
    return {cal:Math.round(cal/s),p:Math.round(p/s),c:Math.round(c/s),f:Math.round(f/s),fi:Math.round(fi/s)};
  },[ings,form.serves]);

  function handlePhoto(file) {
    if(!file||!file.type.match(/^image\/(jpeg|png)$/)) return;
    setPhotoFile(file);
    const reader=new FileReader();
    reader.onload=e=>setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  }
  function addIng(ing) {
    if(!ings.find(i=>i.id===ing.id)) setIngs(prev=>[...prev,{id:ing.id,amt:100}]);
    setSearch("");
  }
  async function save() {
    if(!form.name||ings.length===0||method.filter(m=>m.trim()).length===0) return;
    setUploading(true);
    let photo_url=null;
    if(photoFile){
      try {
        const ext=photoFile.name.split('.').pop().toLowerCase();
        const path=`${Date.now()}.${ext}`;
        const {error}=await supabase.storage.from('recipe-images').upload(path,photoFile,{contentType:photoFile.type});
        if(!error) photo_url=supabase.storage.from('recipe-images').getPublicUrl(path).data.publicUrl;
      } catch(e){}
    }
    const recipe={
      id:Date.now(),
      ...form,
      prep:+form.prep, cook:+form.cook, serves:+form.serves,
      ings,
      method:method.filter(m=>m.trim()),
      tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      custom:true,
      photo_url,
    };
    onSave(recipe);
    setUploading(false);
    setSaved(true);
    setTimeout(()=>{setSaved(false);onClose();},1200);
  }

  const filtered=search.length>1?ingredients.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())||i.sub.toLowerCase().includes(search.toLowerCase())).slice(0,12):[];
  const lbl={fontSize:13,color:"#4A4A4A",display:"block",marginBottom:6,fontWeight:500};
  const inp={width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1px solid #cccccc",borderRadius:tk.r,fontSize:13,background:"var(--color-background-primary)",color:"var(--color-text-primary)"};

  return (
    <div style={{...crd,borderRadius:tk.rXl,marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Add new recipe</h2>
        <button onClick={onClose} style={{padding:"6px 14px",borderRadius:tk.r,cursor:"pointer",fontSize:12}}>Cancel ✕</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        {/* LEFT — recipe info + photo */}
        <div>
          <div style={{marginBottom:14}}>
            <label style={lbl}>Recipe name *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Baharat Lamb Bowl" style={inp}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={lbl}>Description</label>
            <textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Short description of the dish…" rows={2} style={{...inp,resize:"vertical"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={inp}>
                {["Breakfast","Lunch","Dinner","Snack"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Emoji</label>
              <select value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} style={inp}>
                {EMOJIS.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {[["Prep (min)","prep"],["Cook (min)","cook"],["Serves","serves"]].map(([l,k])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" min={0} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={inp}/></div>
            ))}
          </div>
          <div style={{marginBottom:14}}>
            <label style={lbl}>Goal tags</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {GOALS.map(g=>(
                <label key={g.id} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:13,color:"#4A4A4A"}}>
                  <input type="checkbox" checked={form.goal.includes(g.id)} onChange={e=>setForm(f=>({...f,goal:e.target.checked?[...f.goal,g.id]:f.goal.filter(x=>x!==g.id)}))}/>
                  {g.icon} {g.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={lbl}>Tags (comma separated)</label>
            <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="e.g. Middle Eastern, Meal Prep, Low Carb" style={inp}/>
          </div>
          {/* Photo upload */}
          <div style={{marginBottom:14}}>
            <label style={lbl}>Recipe photo (JPG or PNG)</label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" style={{display:"none"}} onChange={e=>handlePhoto(e.target.files?.[0])}/>
            {photoPreview?(
              <div style={{position:"relative"}}>
                <img src={photoPreview} alt="preview" style={{width:"100%",height:140,objectFit:"cover",borderRadius:tk.r,display:"block"}}/>
                <button onClick={()=>{setPhotoFile(null);setPhotoPreview(null);}} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.55)",color:"white",border:"none",borderRadius:"50%",width:24,height:24,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
              </div>
            ):(
              <div
                onClick={()=>fileInputRef.current?.click()}
                onDrop={e=>{e.preventDefault();setDragOver(false);handlePhoto(e.dataTransfer.files?.[0]);}}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                style={{border:`2px dashed ${dragOver?tk.teal:"#cccccc"}`,borderRadius:tk.r,padding:"24px 16px",textAlign:"center",cursor:"pointer",transition:"border-color 0.15s,background 0.15s",background:dragOver?tk.tealSurf:"var(--color-background-secondary)"}}>
                <div style={{fontSize:24,marginBottom:6}}>📷</div>
                <div style={{fontSize:13,color:"#4A4A4A",fontWeight:500}}>Click or drag & drop</div>
                <div style={{fontSize:11,color:"#888",marginTop:3}}>JPG or PNG accepted</div>
              </div>
            )}
          </div>
          <div>
            <label style={lbl}>Method steps</label>
            {method.map((step,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                <span style={{width:22,height:22,borderRadius:"50%",background:tk.tealSurf,color:tk.tealText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,flexShrink:0,marginTop:11}}>{i+1}</span>
                <input value={step} onChange={e=>setMethod(m=>m.map((s,j)=>j===i?e.target.value:s))} placeholder={`Step ${i+1}…`} style={{...inp,flex:1}}/>
                {method.length>1&&<button onClick={()=>setMethod(m=>m.filter((_,j)=>j!==i))} style={{padding:"0 8px",height:44,cursor:"pointer",fontSize:14,color:tk.red,border:"none",background:"transparent"}}>×</button>}
              </div>
            ))}
            <button onClick={()=>setMethod(m=>[...m,""])} style={{fontSize:12,padding:"7px 14px",cursor:"pointer",color:tk.teal,marginTop:4,border:`1px solid ${tk.teal}`,borderRadius:tk.r,background:"transparent",fontWeight:500}}>+ Add step</button>
          </div>
        </div>

        {/* RIGHT — ingredients + live macros */}
        <div>
          <div style={{marginBottom:14}}>
            <label style={lbl}>Search ingredients *</label>
            <div style={{position:"relative"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type name or category…" style={inp}/>
              {filtered.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--color-background-primary)",border:"1px solid #cccccc",borderRadius:tk.r,zIndex:10,maxHeight:220,overflowY:"auto",marginTop:4,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
                  {filtered.map(ing=>(
                    <div key={ing.id} onClick={()=>addIng(ing)} style={{padding:"10px 14px",borderBottom:tk.bd,cursor:"pointer",display:"flex",justifyContent:"space-between",fontSize:12,alignItems:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--color-background-secondary)"}
                      onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <div><span style={{fontWeight:500}}>{ing.name}</span><span style={{marginLeft:6}}><CatBadge cat={ing.cat}/></span></div>
                      <span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{ing.cal} kcal/{ing.ref}g</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {ings.length>0?(
            <div style={{border:"1px solid #cccccc",borderRadius:tk.rLg,overflow:"hidden",marginBottom:14}}>
              <div style={{padding:"8px 14px",background:"var(--color-background-secondary)",fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.08em",display:"grid",gridTemplateColumns:"1fr 120px auto"}}>
                <span>Ingredient</span><span>Amount (g)</span><span></span>
              </div>
              {ings.map((ri,i)=>{
                const ing=BASE_ING.find(x=>x.id===ri.id)||ingredients.find(x=>x.id===ri.id);
                if(!ing) return null;
                const m=ingMacros(ri);
                return (
                  <div key={i} style={{padding:"8px 14px",borderTop:"1px solid #cccccc",display:"grid",gridTemplateColumns:"1fr 120px auto",alignItems:"center",gap:8}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:500}}>{ing.name}</div>
                      <div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{Math.round(m.cal)} kcal · {Math.round(m.p)}g P · {Math.round(m.c)}g C · {Math.round(m.f)}g F</div>
                    </div>
                    <input type="number" min={1} max={1000} value={ri.amt}
                      onChange={e=>setIngs(prev=>prev.map((x,j)=>j===i?{...x,amt:+e.target.value}:x))}
                      style={{...inp}}/>
                    <button onClick={()=>setIngs(prev=>prev.filter((_,j)=>j!==i))} style={{padding:"0 8px",height:44,cursor:"pointer",fontSize:14,color:tk.red,border:"none",background:"transparent"}}>×</button>
                  </div>
                );
              })}
            </div>
          ):(
            <div style={{border:"2px dashed #cccccc",borderRadius:tk.rLg,padding:"28px",textAlign:"center",color:"var(--color-text-tertiary)",fontSize:13,marginBottom:14}}>
              Search and click ingredients above to add them here
            </div>
          )}

          {/* Live macro preview */}
          <div style={{background:"var(--color-background-secondary)",borderRadius:tk.rLg,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:12,color:"#4A4A4A",marginBottom:10,fontWeight:600}}>Live macro preview — per serving</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,textAlign:"center",marginBottom:10}}>
              {[["Cal",totals.cal,tk.teal],["P",totals.p+"g",tk.blue],["C",totals.c+"g",tk.green],["F",totals.f+"g",tk.coral],["Fibre",totals.fi+"g",tk.gray]].map(([l,v,c])=>(
                <div key={l}><div style={{fontSize:18,fontWeight:500,color:c}}>{v}</div><div style={{fontSize:9,color:"var(--color-text-tertiary)",marginTop:2}}>{l}</div></div>
              ))}
            </div>
            {totals.cal>0&&(
              <div style={{height:4,borderRadius:2,background:"var(--color-background-primary)",overflow:"hidden",display:"flex"}}>
                {[[totals.p*4,tk.blue],[totals.c*4,tk.green],[totals.f*9,tk.coral]].map(([kcal,col],i)=>(
                  <div key={i} style={{width:totals.cal>0?Math.round(kcal/totals.cal*100)+"%":"0%",height:"100%",background:col}}/>
                ))}
              </div>
            )}
          </div>

          <button onClick={save} disabled={uploading} style={{width:"100%",padding:"13px",background:saved?"#4A7C3F":tk.coral,color:"white",borderRadius:tk.rLg,cursor:uploading?"wait":"pointer",fontSize:14,fontWeight:600,border:"none",transition:"background 0.2s",opacity:uploading?0.75:1}}>
            {uploading?"Uploading photo…":saved?"✓ Recipe saved!":"Save recipe"}
          </button>
          {(!form.name||ings.length===0)&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",textAlign:"center",marginTop:8}}>Add a name and at least one ingredient to save</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Supabase helpers ───────────────────────────────────────────────────────────
function safeParse(val, fallback=[]) {
  if(Array.isArray(val)) return val;
  if(typeof val==='string'){ try{ return JSON.parse(val); }catch(e){ return fallback; } }
  return fallback;
}
function normalizeRecipe(r) {
  return {
    ...r,
    desc: r.desc ?? r.description ?? '',
    ings:  parseArr(r.ings),
    tags:  parseArr(r.tags),
    method:parseArr(r.method),
    goal:  parseArr(r.goal),
  };
}

// ─── Paginated recipe fetch — bypasses PostgREST default row cap ────────────────
async function fetchAllRecipes() {
  const PAGE = 1000;
  let all = [], from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('id')
      .range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    all = [...all, ...data];
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`[Recipes] loaded ${all.length} total from Supabase`);
  return all;
}

// ─── Main app ───────────────────────────────────────────────────────────────────
export default function BurntCaloriesApp() {
  const [tab,setTab]   = useState("dashboard");
  const [profile,setProfile] = useState({name:"Paul",gender:"male",age:"40",weight:"90",height:"180",goal:"fat_loss",activityLevel:"very"});
  const [macros,setMacros] = useState(null);
  const [recipes,setRecipes] = useState(()=>{
    try { const s=window.storage; return SEED_RECIPES; } catch(e){ return SEED_RECIPES; }
  });
  const [selRecipe,setSelRecipe] = useState(null);
  const [selCategory,setSelCategory] = useState(null);
  const [showUploader,setShowUploader] = useState(false);
  const [recCat,setRecCat]    = useState("All");
  const [recGoal,setRecGoal]  = useState("all");
  const [recSearch,setRecSearch] = useState("");
  const [recTag,setRecTag]    = useState("");
  const [ingSearch,setIngSearch] = useState("");
  const [ingCat,setIngCat]    = useState("All");
  const [ingSub,setIngSub]    = useState("All");
  const [ingredients,setIngredients] = useState([]);
  const [builderIngs,setBuilderIngs] = useState([]);
  const [builderName,setBuilderName] = useState("");
  const [builderSearch,setBuilderSearch] = useState("");
  const [clients,setClients] = useState([
    {id:1,name:"Paul Britton",  age:40,weight:90, height:180,gender:"male",  goal:"fat_loss",    activityLevel:"very"},
    {id:2,name:"Alex Carter",   age:34,weight:78, height:175,gender:"male",  goal:"muscle_gain", activityLevel:"moderate"},
    {id:3,name:"Layla Hassan",  age:28,weight:62, height:165,gender:"female",goal:"fat_loss",    activityLevel:"light"},
    {id:4,name:"Omar Al-Rashid",age:45,weight:95, height:183,gender:"male",  goal:"longevity",   activityLevel:"moderate"},
    {id:5,name:"Sara Khalid",   age:31,weight:68, height:162,gender:"female",goal:"maintenance", activityLevel:"very"},
  ]);
  const [selClient,setSelClient] = useState(null);
  const [clientDraft,setClientDraft] = useState(null);
  const [newClientMode,setNewClientMode] = useState(false);
  const [clientStatus,setClientStatus] = useState(null);
  const [calcDraft,setCalcDraft] = useState({...{name:"Paul",gender:"male",age:"40",weight:"90",height:"180",goal:"fat_loss",activityLevel:"very"}});
  const [calcStatus,setCalcStatus] = useState(null);
  const [profileId,setProfileId] = useState(null);
  const [planClientId,setPlanClientId] = useState(null);
  const [currentPlan,setCurrentPlan] = useState(null);
  const [planView,setPlanView] = useState('plan');
  const [planSwapTarget,setPlanSwapTarget] = useState(null);
  const [planSwapSearch,setPlanSwapSearch] = useState('');
  const [showCatManager,setShowCatManager] = useState(false);
  const [catSearch,setCatSearch] = useState('');
  const [catDrafts,setCatDrafts] = useState({});
  const [catSaving,setCatSaving] = useState(false);
  const [isMobile,setIsMobile] = useState(()=>typeof window!=='undefined'?window.innerWidth<768:false);
  const [navOpen,setNavOpen] = useState(false);

  useEffect(()=>{setMacros(calcMacros(profile));},[profile]);
  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener('resize',check);
    return()=>window.removeEventListener('resize',check);
  },[]);
  useEffect(()=>{
    if(!newClientMode) setClientDraft(selClient ? {...selClient} : null);
  },[selClient?.id]);

  useEffect(()=>{
    async function loadDb() {
      try {
        const [{data:ings,error:ie},{data:cls,error:ce},{data:profs,error:pe}] = await Promise.all([
          supabase.from('ingredients').select('*').order('id'),
          supabase.from('clients').select('*').order('id'),
          supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(1),
        ]);
        if(!ie && ings?.length) {
          const normalized=ings.map(i=>({...i,benefits:Array.isArray(i.benefits)?i.benefits:[]}));
          BASE_ING=normalized;
          setIngredients(normalized);
        }
        const recs = await fetchAllRecipes();
        if(recs.length) setRecipes(recs.map(normalizeRecipe));
        if(!ce && cls?.length) setClients(cls.map(c=>({...c,activityLevel:c.activity_level})));
        if(!pe && profs?.length) {
          const p=profs[0];
          const loaded={name:p.name||"",gender:p.gender||"male",age:String(p.age||""),weight:String(p.weight||""),height:String(p.height||""),goal:p.goal||"fat_loss",activityLevel:p.activity_level||"moderate"};
          setProfile(loaded);
          setCalcDraft(loaded);
          setProfileId(p.id);
        }
      } catch(e){}
    }
    loadDb();
  },[]);

  async function addRecipe(recipe) {
    setRecipes(prev=>[...prev,recipe]);
    try { await supabase.from('recipes').upsert(recipe,{onConflict:'id'}); } catch(e){}
  }
  async function deleteRecipe(id) {
    setRecipes(prev=>prev.filter(r=>r.id!==id));
    if(selRecipe?.id===id) setSelRecipe(null);
    try { await supabase.from('recipes').delete().eq('id',id); } catch(e){}
  }
  async function saveProfile() {
    setCalcStatus('saving');
    const payload={name:calcDraft.name,age:+calcDraft.age||null,weight:+calcDraft.weight||null,height:+calcDraft.height||null,gender:calcDraft.gender,goal:calcDraft.goal,activity_level:calcDraft.activityLevel};
    try {
      if(profileId) {
        const {error}=await supabase.from('profiles').update(payload).eq('id',profileId);
        if(error) throw error;
      } else {
        const {data,error}=await supabase.from('profiles').insert(payload).select().single();
        if(error) throw error;
        setProfileId(data.id);
      }
      setProfile({...calcDraft});
      setCalcStatus('ok');
      setTimeout(()=>setCalcStatus(null),2000);
    } catch(e) {
      setCalcStatus('err');
      setTimeout(()=>setCalcStatus(null),3000);
    }
  }
  function updateRecipe(updated) {
    setRecipes(prev=>prev.map(r=>r.id===updated.id?normalizeRecipe(updated):r));
    if(selRecipe?.id===updated.id) setSelRecipe(normalizeRecipe(updated));
  }
  async function saveClient() {
    if(!clientDraft) return;
    if(!clientDraft.name?.trim()||!clientDraft.age||!clientDraft.weight||!clientDraft.height) {
      setClientStatus({type:'err',msg:'Please fill in name, age, weight and height.'});
      return;
    }
    setClientStatus({type:'saving',msg:'Saving…'});
    if(newClientMode) {
      const payload={
        name:clientDraft.name.trim(), age:+clientDraft.age, weight:+clientDraft.weight,
        height:+clientDraft.height, gender:clientDraft.gender, goal:clientDraft.goal,
        activity_level:clientDraft.activityLevel, notes:clientDraft.notes||null,
      };
      const {data,error}=await supabase.from('clients').insert(payload).select().single();
      if(error){setClientStatus({type:'err',msg:'Save failed: '+error.message});return;}
      const newC={...data,activityLevel:data.activity_level};
      setClients(prev=>[...prev,newC]);
      setSelClient(newC);
      setNewClientMode(false);
      setClientStatus({type:'ok',msg:'Client saved ✓'});
    } else {
      const updated={...clientDraft};
      setClients(prev=>prev.map(c=>c.id===updated.id?updated:c));
      setSelClient(updated);
      const {error}=await supabase.from('clients').upsert({
        id:updated.id, name:updated.name, age:updated.age, weight:updated.weight,
        height:updated.height, gender:updated.gender, goal:updated.goal,
        activity_level:updated.activityLevel, notes:updated.notes||null,
      },{onConflict:'id'});
      if(error) setClientStatus({type:'err',msg:'Save failed: '+error.message});
      else setClientStatus({type:'ok',msg:'Changes saved ✓'});
    }
    setTimeout(()=>setClientStatus(null),3000);
  }
  async function deleteClient(id) {
    if(!window.confirm("Delete this client? This cannot be undone.")) return;
    setClients(prev=>prev.filter(c=>c.id!==id));
    setSelClient(null);
    setClientDraft(null);
    setNewClientMode(false);
    try { await supabase.from('clients').delete().eq('id',id); } catch(e){}
  }

  const filteredRecipes = useMemo(()=>{
    let base=selCategory?getRecipesForCategory(selCategory,recipes):recipes;
    if(recSearch){const q=recSearch.toLowerCase();base=base.filter(r=>r.name.toLowerCase().includes(q)||(r.desc||r.description||'').toLowerCase().includes(q));}
    return base;
  },[recipes,selCategory,recSearch]);

  const ingCats = useMemo(()=>["All",...new Set(ingredients.map(i=>i.cat))],[ingredients]);
  const ingSubs = useMemo(()=>ingCat==="All"?["All"]:["All",...new Set(ingredients.filter(i=>i.cat===ingCat).map(i=>i.sub))],[ingCat,ingredients]);
  const filteredIngs = useMemo(()=>ingredients.filter(i=>{
    const mc=ingCat==="All"||i.cat===ingCat;
    const ms=ingSub==="All"||i.sub===ingSub;
    const mt=!ingSearch||i.name.toLowerCase().includes(ingSearch.toLowerCase())||i.sub.toLowerCase().includes(ingSearch.toLowerCase());
    return mc&&ms&&mt;
  }),[ingCat,ingSub,ingSearch]);

  const builderTotals = useMemo(()=>{
    let cal=0,p=0,c=0,f=0,fi=0;
    builderIngs.forEach(bi=>{const m=ingMacros(bi);cal+=m.cal;p+=m.p;c+=m.c;f+=m.f;fi+=m.fi;});
    return {cal:Math.round(cal),p:Math.round(p),c:Math.round(c),f:Math.round(f),fi:Math.round(fi)};
  },[builderIngs]);

  const liveCalcMacros = useMemo(()=>calcMacros(calcDraft),[calcDraft]);

  const TABS=[
    {id:"dashboard",   label:"Dashboard",   icon:"📊"},
    {id:"calculator",  label:"Calculator",  icon:"🧮"},
    {id:"recipes",     label:"Recipes",     icon:"🍽️"},
    {id:"plans",       label:"Meal plans",  icon:"📅"},
    {id:"builder",     label:"Meal builder",icon:"🔧"},
    {id:"ingredients", label:"Ingredients", icon:"🌿"},
    {id:"clients",     label:"Clients",     icon:"👥"},
    {id:"workouts",    label:"Workouts",    icon:"🏋️"},
  ];

  const activeTab=TABS.find(t=>t.id===tab);
  const Nav = (
    <div style={{position:"sticky",top:0,zIndex:100}}>
      {/* Top tier — white, logo + user info */}
      <div style={{background:"#ffffff",borderBottom:"1px solid #e8e8e8"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:`0 ${isMobile?16:24}px`,display:"flex",alignItems:"center",justifyContent:"space-between",height:isMobile?52:64}}>
          <img src="/logo.png" alt="Burnt Calories" style={{height:isMobile?34:48,display:"block"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"#4A4A4A",fontWeight:500}}>Hi, {profile.name}</span>
            {macros&&!isMobile&&<Pill text={macros.targetCal+" kcal"} color={tk.tealText} bg={tk.tealSurf}/>}
          </div>
        </div>
      </div>

      {/* Bottom tier — desktop: full tab bar | mobile: current tab + hamburger */}
      <div style={{background:"#2D5A27",position:"relative"}}>
        {isMobile ? (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:44}}>
              <span style={{color:"#fff",fontSize:14,fontWeight:500}}>
                {activeTab?.icon} {activeTab?.label}
              </span>
              <button onClick={()=>setNavOpen(v=>!v)}
                style={{color:"#fff",background:"transparent",border:"none",cursor:"pointer",padding:"4px 8px",fontSize:22,lineHeight:1,display:"flex",alignItems:"center"}}>
                {navOpen?"✕":"≡"}
              </button>
            </div>
            {navOpen&&(
              <>
                {/* Backdrop */}
                <div onClick={()=>setNavOpen(false)} style={{position:"fixed",inset:0,zIndex:99,background:"transparent"}}/>
                {/* Dropdown */}
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#2D5A27",zIndex:100,boxShadow:"0 8px 24px rgba(0,0,0,0.30)"}}>
                  {TABS.map(tb=>(
                    <button key={tb.id}
                      onClick={()=>{setTab(tb.id);setSelRecipe(null);setShowUploader(false);setNavOpen(false);}}
                      style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 20px",background:tab===tb.id?"rgba(255,255,255,0.12)":"transparent",color:"#fff",border:"none",borderTop:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",fontSize:15,fontWeight:tab===tb.id?600:400,textAlign:"left"}}>
                      <span style={{fontSize:19,width:26,flexShrink:0}}>{tb.icon}</span>
                      {tb.label}
                      {tab===tb.id&&<span style={{marginLeft:"auto",color:"#E8621A",fontSize:18}}>●</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 8px",display:"flex",justifyContent:"space-evenly",alignItems:"stretch",height:44}}>
            {TABS.map(tb=>(
              <button key={tb.id} onClick={()=>{setTab(tb.id);setSelRecipe(null);setShowUploader(false);}}
                style={{flex:1,padding:"0 10px",fontSize:12,whiteSpace:"nowrap",borderRadius:0,background:tab===tb.id?"rgba(255,255,255,0.10)":"transparent",color:"#ffffff",fontWeight:500,letterSpacing:"0.03em",borderBottom:tab===tb.id?"2px solid #E8621A":"2px solid transparent",cursor:"pointer",transition:"background 0.15s",minHeight:44}}
                onMouseEnter={e=>{ if(tab!==tb.id) e.currentTarget.style.background="rgba(255,255,255,0.15)"; }}
                onMouseLeave={e=>{ if(tab!==tb.id) e.currentTarget.style.background="transparent"; }}>
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const wrap=ch=><div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"16px 12px":"28px 20px"}}>{ch}</div>;

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  if(tab==="dashboard") {
    const viewingClient = selClient;
    const dashSubject = viewingClient
      ? {...viewingClient, age:String(viewingClient.age), weight:String(viewingClient.weight), height:String(viewingClient.height)}
      : profile;
    const dashMacros = viewingClient ? calcMacros(dashSubject) : macros;
    return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(<>
        {viewingClient&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:tk.tealSurf,border:`1px solid ${tk.teal}30`,borderRadius:tk.rLg,padding:"10px 16px",marginBottom:16}}>
            <span style={{fontSize:13,fontWeight:500,color:tk.tealText}}>👁 Viewing plan for: {viewingClient.name}</span>
            <button onClick={()=>setSelClient(null)} style={{fontSize:12,color:tk.tealText,cursor:"pointer",border:"none",background:"transparent",fontWeight:500}}>← Back to my plan</button>
          </div>
        )}
        <Hdr title={viewingClient?"Client dashboard":"Your dashboard"} sub={`${ingredients.length} ingredients · ${recipes.length} recipes · personalised for ${dashSubject.name} · Burnt Calories`}/>
        {dashMacros?(<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,marginBottom:20}}>
            <Stat label="Daily calories" value={dashMacros.targetCal} sub="target" color={tk.teal}/>
            <Stat label="Protein"        value={dashMacros.proteinG+"g"} sub="per day" color={tk.blue}/>
            <Stat label="Carbohydrate"   value={dashMacros.carbG+"g"} sub="per day" color={tk.green}/>
            <Stat label="Dietary fat"    value={dashMacros.fatG+"g"} sub="per day" color={tk.coral}/>
            <Stat label="BMR"            value={dashMacros.bmr} sub="at rest" color={tk.amber}/>
            <Stat label="TDEE"           value={dashMacros.tdee} sub="maintenance" color={tk.purple}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:20}}>
            <div style={crd}>
              <h2 style={{fontSize:13,fontWeight:500,margin:"0 0 16px"}}>Macro distribution</h2>
              {[{label:"Protein",g:dashMacros.proteinG,kcal:dashMacros.proteinG*4,color:tk.blue},{label:"Carbohydrate",g:dashMacros.carbG,kcal:dashMacros.carbG*4,color:tk.green},{label:"Fat",g:dashMacros.fatG,kcal:dashMacros.fatG*9,color:tk.coral}].map(m=>(
                <div key={m.label} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>{m.label}</span><span style={{color:"var(--color-text-secondary)"}}>{m.g}g · {m.kcal} kcal · {Math.round(m.kcal/dashMacros.targetCal*100)}%</span></div>
                  <div style={{height:4,background:"var(--color-background-secondary)",borderRadius:2}}><div style={{width:Math.round(m.kcal/dashMacros.targetCal*100)+"%",height:"100%",background:m.color,borderRadius:2}}/></div>
                </div>
              ))}
            </div>
            <div style={crd}>
              <h2 style={{fontSize:13,fontWeight:500,margin:"0 0 14px"}}>Active goal</h2>
              {(()=>{const g=GOALS.find(x=>x.id===dashSubject.goal);const desc={fat_loss:"−400 kcal deficit · high protein to preserve lean mass · low-GI carbs.",muscle_gain:"+400 kcal surplus · progressive overload · complex carbs around workouts.",longevity:"+100 kcal · anti-inflammatory foods · omega-3 rich · antioxidant-dense.",maintenance:"Balanced macros at TDEE · flexible eating · high food quality."};return(
                <div><div style={{fontSize:26,marginBottom:8}}>{g?.icon}</div><div style={{fontSize:14,fontWeight:500,marginBottom:6}}>{g?.label}</div><p style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.6,margin:"0 0 12px"}}>{desc[dashSubject.goal]}</p><div style={{padding:"8px 10px",background:"var(--color-background-secondary)",borderRadius:tk.r,fontSize:11,color:"var(--color-text-secondary)"}}>{Math.round(dashMacros.proteinG/+dashSubject.weight*10)/10}g protein/kg · {dashMacros.targetCal-dashMacros.tdee>0?"+":""}{dashMacros.targetCal-dashMacros.tdee} kcal vs TDEE</div></div>
              );})()}
            </div>
          </div>
          <div style={crd}>
            <h2 style={{fontSize:13,fontWeight:500,margin:"0 0 16px"}}>6-meal daily performance structure</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
              {[{label:"Meal 1 — Pre-gym",time:"6:30 am",desc:"Oats · egg · WPI",pct:0.20},{label:"Meal 2 — Post-gym",time:"9:00 am",desc:"Eggs · rice · protein",pct:0.22},{label:"Meal 3 — Lunch",time:"12:30 pm",desc:"Chicken or steak salad",pct:0.20},{label:"Meal 4 — Afternoon",time:"3:30 pm",desc:"Steak or chicken · veg",pct:0.18},{label:"Meal 5 — Dinner",time:"6:30 pm",desc:"Turkey bol · sweet potato",pct:0.15},{label:"Meal 6 — Night",time:"9:00 pm",desc:"Protein shake or cottage cheese",pct:0.05}].map((m,i)=>(
                <div key={i} style={{background:"var(--color-background-secondary)",borderRadius:tk.r,padding:12}}>
                  <div style={{fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{m.time}</div>
                  <div style={{fontSize:11,fontWeight:500,lineHeight:1.3,marginBottom:4}}>{m.label}</div>
                  <div style={{fontSize:10,color:"var(--color-text-secondary)",marginBottom:8}}>{m.desc}</div>
                  <div style={{fontSize:14,fontWeight:500,color:tk.teal}}>{Math.round(dashMacros.targetCal*m.pct)} kcal</div>
                </div>
              ))}
            </div>
          </div>
        </>):(
          <div style={{...crd,textAlign:"center",padding:60}}>
            <div style={{fontSize:32,marginBottom:12}}>🔥</div>
            <p style={{color:"var(--color-text-secondary)",fontSize:13,marginBottom:20}}>Enter your details to see your personalised Burnt Calories targets.</p>
            <button onClick={()=>setTab("calculator")} style={{padding:"10px 24px",background:tk.teal,color:"white",borderRadius:tk.r,cursor:"pointer",fontSize:13}}>Open calculator</button>
          </div>
        )}
      </>)}
    </div>
  );};

  // ── CALCULATOR ───────────────────────────────────────────────────────────────
  if(tab==="calculator") {
    const inp3={width:"100%",boxSizing:"border-box",padding:"10px 14px",border:"1px solid #C0DD97",borderRadius:tk.r,fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"};
    const lbl3={fontSize:13,color:"#4A4A4A",display:"block",marginBottom:6,fontWeight:500};
    const secHdr={fontSize:14,fontWeight:600,color:"#2D5A27",margin:"0 0 16px"};
    const saving3=calcStatus==='saving';
    return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(
        <div style={{maxWidth:640}}>
          <Hdr title="Macro calculator" sub="Harris-Benedict BMR · activity-adjusted TDEE · your personalised Burnt Calories targets"/>

          {/* Personal details */}
          <div style={{...crd,marginBottom:16}}>
            <h2 style={secHdr}>Personal details</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              {[{k:"name",l:"Full name",type:"text",ph:"Your name",col:"1/-1"},{k:"age",l:"Age (yrs)",type:"number",ph:"35"},{k:"weight",l:"Weight (kg)",type:"number",ph:"80"},{k:"height",l:"Height (cm)",type:"number",ph:"178"}].map(f=>(
                <div key={f.k} style={f.col?{gridColumn:f.col}:{}}>
                  <label style={lbl3}>{f.l}</label>
                  <input type={f.type} min={f.type==="number"?0:undefined} value={calcDraft[f.k]||""} onChange={e=>setCalcDraft(d=>({...d,[f.k]:e.target.value}))} placeholder={f.ph} style={inp3}/>
                </div>
              ))}
            </div>
            <div>
              <label style={lbl3}>Biological sex</label>
              <div style={{display:"flex",gap:8}}>
                {["male","female"].map(g=>(
                  <button key={g} onClick={()=>setCalcDraft(d=>({...d,gender:g}))} style={{flex:1,padding:"10px 0",borderRadius:tk.r,background:calcDraft.gender===g?tk.teal:"transparent",color:calcDraft.gender===g?"white":"#4A4A4A",cursor:"pointer",fontSize:13,fontWeight:calcDraft.gender===g?600:400,border:calcDraft.gender===g?`1.5px solid ${tk.teal}`:"1px solid #C0DD97",transition:"all 0.15s"}}>
                    {g==="male"?"♂ Male":"♀ Female"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary goal */}
          <div style={{...crd,marginBottom:16}}>
            <h2 style={secHdr}>Primary goal</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {GOALS.map(g=>(
                <button key={g.id} onClick={()=>setCalcDraft(d=>({...d,goal:g.id}))} style={{padding:14,borderRadius:tk.r,border:calcDraft.goal===g.id?`2px solid ${g.color}`:"1px solid #C0DD97",background:calcDraft.goal===g.id?g.color+"12":"transparent",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{g.icon}</div>
                  <div style={{fontSize:13,fontWeight:calcDraft.goal===g.id?600:400,color:"#1a1a1a"}}>{g.label}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>{g.adj>0?"+":""}{g.adj} kcal vs TDEE</div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity level */}
          <div style={{...crd,marginBottom:16}}>
            <h2 style={secHdr}>Activity level</h2>
            {ACTIVITY.map(a=>(
              <button key={a.id} onClick={()=>setCalcDraft(d=>({...d,activityLevel:a.id}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"11px 14px",borderRadius:tk.r,border:calcDraft.activityLevel===a.id?`2px solid ${tk.teal}`:"1px solid #C0DD97",background:calcDraft.activityLevel===a.id?tk.tealSurf:"transparent",cursor:"pointer",marginBottom:6,textAlign:"left",transition:"all 0.15s"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:calcDraft.activityLevel===a.id?600:400,color:calcDraft.activityLevel===a.id?tk.tealText:"#1a1a1a"}}>{a.label}</div>
                  <div style={{fontSize:11,color:"#888"}}>{a.desc}</div>
                </div>
                <span style={{fontSize:11,color:"#aaa",fontWeight:500}}>×{a.mult}</span>
              </button>
            ))}
          </div>

          {/* Live results */}
          {liveCalcMacros&&(
            <div style={{...crd,background:"#EAF3DE",border:`1.5px solid #C0DD97`,marginBottom:20}}>
              <h2 style={secHdr}>Your targets</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
                {[["BMR",liveCalcMacros.bmr,"kcal/day"],["TDEE",liveCalcMacros.tdee,"kcal/day"],["Daily target",liveCalcMacros.targetCal,"kcal/day"]].map(([l,v,d])=>(
                  <div key={l} style={{textAlign:"center",background:"rgba(255,255,255,0.7)",borderRadius:tk.r,padding:"14px 8px"}}>
                    <div style={{fontSize:11,color:"#5a7a52",marginBottom:4}}>{l}</div>
                    <div style={{fontSize:24,fontWeight:600,color:"#2D5A27"}}>{v}</div>
                    <div style={{fontSize:9,color:"#7a9a72",marginTop:2,textTransform:"uppercase",letterSpacing:"0.07em"}}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {[["Protein",liveCalcMacros.proteinG+"g",tk.blue],["Carbs",liveCalcMacros.carbG+"g",tk.green],["Fat",liveCalcMacros.fatG+"g",tk.coral]].map(([l,v,c])=>(
                  <div key={l} style={{borderLeft:`3px solid ${c}`,paddingLeft:12}}>
                    <div style={{fontSize:12,color:"#5a7a52"}}>{l}</div>
                    <div style={{fontSize:22,fontWeight:600,color:c,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          {calcStatus==='ok'&&(
            <div style={{textAlign:"center",fontSize:14,fontWeight:500,color:"#2D5A27",marginBottom:12}}>Profile saved ✓</div>
          )}
          {calcStatus==='err'&&(
            <div style={{textAlign:"center",fontSize:13,color:"#c00",marginBottom:12}}>Save failed — please try again.</div>
          )}
          <button onClick={saveProfile} disabled={saving3} style={{width:"100%",height:48,borderRadius:40,border:"none",background:saving3?"#ccc":"#E8621A",color:"#fff",fontSize:15,fontWeight:600,cursor:saving3?"default":"pointer",letterSpacing:"0.01em",transition:"background 0.15s",boxShadow:saving3?"none":"0 2px 12px rgba(232,98,26,0.30)"}}>
            {saving3?"Saving…":"Save my profile"}
          </button>
          <p style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:10}}>Saves your name, targets, and goals — updates the dashboard and nav immediately.</p>
        </div>
      )}
    </div>
  );}

  // ── RECIPES ──────────────────────────────────────────────────────────────────
  if(tab==="recipes") return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <Hdr
            title={selCategory?selCategory.label:"Recipe library"}
            sub={selCategory?`${filteredRecipes.length} recipes in this category · Burnt Calories`:`${recipes.length} recipes · ${recipes.filter(r=>r.custom).length} custom · full macro breakdown`}
          />
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {selCategory&&!showUploader&&(
              <button onClick={()=>{setSelCategory(null);setSelRecipe(null);setRecSearch('');}} style={{padding:"9px 18px",borderRadius:40,fontSize:13,fontWeight:500,cursor:"pointer",background:"white",color:tk.teal,border:`1px solid ${tk.teal}`,whiteSpace:"nowrap"}}>
                ← All categories
              </button>
            )}
            {selRecipe&&selCategory&&!showUploader&&(
              <button onClick={()=>setSelRecipe(null)} style={{padding:"9px 18px",borderRadius:40,fontSize:13,fontWeight:500,cursor:"pointer",background:"white",color:tk.gray,border:`1px solid ${tk.gray}`,whiteSpace:"nowrap"}}>
                ← Back
              </button>
            )}
            {!showUploader&&(
              <button onClick={()=>{setShowCatManager(true);setCatSearch('');setCatDrafts({});}} style={{padding:"9px 18px",background:"transparent",color:tk.teal,borderRadius:tk.rLg,cursor:"pointer",fontSize:13,fontWeight:500,border:`1px solid ${tk.teal}`,whiteSpace:"nowrap"}}>
                ⚙ Manage categories
              </button>
            )}
            <button onClick={()=>{setShowUploader(u=>!u);setSelRecipe(null);}} style={{padding:"9px 18px",background:showUploader?"var(--color-background-secondary)":tk.teal,color:showUploader?"var(--color-text-primary)":"white",borderRadius:tk.rLg,cursor:"pointer",fontSize:13,fontWeight:500,border:showUploader?tk.bd:"none",whiteSpace:"nowrap"}}>
              {showUploader?"Cancel":"+ Add recipe"}
            </button>
          </div>
        </div>

        {showUploader&&<RecipeUploader ingredients={ingredients} onSave={r=>{addRecipe(r);setShowUploader(false);}} onClose={()=>setShowUploader(false)}/>}

        {/* ── Category grid ── */}
        {!showUploader&&!selCategory&&(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:12}}>
            {RECIPE_CATEGORIES.map(cat=>{
              const count=getRecipesForCategory(cat,recipes).length;
              return (
                <div key={cat.id}
                  onClick={()=>{setSelCategory(cat);setSelRecipe(null);setRecSearch('');window.scrollTo({top:0,behavior:'smooth'});}}
                  style={{
                    height:130,borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",
                    backgroundImage:`url(${cat.photo})`,backgroundSize:"cover",backgroundPosition:"center",
                    backgroundColor:`${cat.color}33`,
                    border:`1px solid ${cat.color}55`,
                    transition:"transform 0.15s,border-color 0.15s",userSelect:"none",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.borderColor=cat.color;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=`${cat.color}55`;}}>
                  {/* gradient overlay */}
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.62) 100%)"}}/>
                  {/* content */}
                  <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"10px 14px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#fff",lineHeight:1.2,textShadow:"0 1px 3px rgba(0,0,0,0.5)"}}>{cat.label}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.72)",marginTop:2}}>{count} recipes</div>
                    </div>
                    <span style={{fontSize:26,lineHeight:1,filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.5))"}}>{cat.emoji}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Category recipe list ── */}
        {!showUploader&&selCategory&&<>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <input value={recSearch} onChange={e=>setRecSearch(e.target.value)} placeholder={`Search ${selCategory.label}…`} style={{flex:1,minWidth:180}}/>
          </div>
          {selRecipe&&<RecipeDetail key={selRecipe.id} recipe={selRecipe} onClose={()=>setSelRecipe(null)} onDelete={selRecipe.custom?deleteRecipe:null} onUpdate={updateRecipe} allIngredients={ingredients}/>}
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:14,marginTop:selRecipe?16:0}}>{filteredRecipes.length} recipes</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
            {filteredRecipes.map(r=><RecipeCard key={r.id} recipe={r} selected={selRecipe?.id===r.id} onSelect={r=>{
              const next=selRecipe?.id===r.id?null:r;
              setSelRecipe(next);
              if(next) window.scrollTo({top:0,behavior:'smooth'});
            }}/>)}
          </div>
        </>}
      </>)}

      {/* ── Bulk category editor modal ── */}
      {showCatManager&&(()=>{
        function getCatDraft(r){
          const d=catDrafts[r.id]||{};
          return {cat:d.cat??r.cat??'Lunch',tags:d.tags??parseArr(r.tags),goal:d.goal??parseArr(r.goal)};
        }
        function patchDraft(id,patch){
          setCatDrafts(prev=>({...prev,[id]:{...(prev[id]||{}), ...patch}}));
        }
        async function saveAll(){
          setCatSaving(true);
          for(const [idStr,patch] of Object.entries(catDrafts)){
            const id=+idStr;
            const {error}=await supabase.from('recipes').update(patch).eq('id',id);
            if(!error){const rec=recipes.find(r=>r.id===id);if(rec)updateRecipe({...rec,...patch});}
          }
          setCatDrafts({});setCatSaving(false);setShowCatManager(false);
        }
        const changed=Object.keys(catDrafts).length;
        const q=catSearch.toLowerCase();
        const visible=recipes.filter(r=>!q||r.name.toLowerCase().includes(q)||(r.cat||'').toLowerCase().includes(q)).slice(0,120);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",flexDirection:"column"}}
            onClick={()=>setShowCatManager(false)}>
            <div style={{background:"var(--color-background-primary)",margin:"24px auto",width:"min(1100px,96vw)",maxHeight:"calc(100vh - 48px)",borderRadius:tk.rLg,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 12px 48px rgba(0,0,0,0.3)"}}
              onClick={e=>e.stopPropagation()}>
              {/* header */}
              <div style={{padding:"16px 20px",borderBottom:tk.bd,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
                <h2 style={{fontSize:16,fontWeight:600,margin:0,flex:1}}>Manage recipe categories</h2>
                <input value={catSearch} onChange={e=>setCatSearch(e.target.value)} placeholder="Search recipes…"
                  style={{padding:"7px 12px",borderRadius:8,border:tk.bdMed,fontSize:12,width:220,outline:"none"}}/>
                <button onClick={saveAll} disabled={catSaving||changed===0}
                  style={{padding:"9px 20px",borderRadius:40,border:"none",background:changed>0?"#E8621A":"#ccc",color:"white",fontSize:13,fontWeight:600,cursor:changed>0?"pointer":"default",whiteSpace:"nowrap"}}>
                  {catSaving?"Saving…":`Save ${changed>0?changed+" change"+(changed>1?"s":""):"changes"}`}
                </button>
                <button onClick={()=>setShowCatManager(false)} style={{fontSize:22,border:"none",background:"transparent",cursor:"pointer",color:"var(--color-text-secondary)",padding:"0 4px",lineHeight:1}}>×</button>
              </div>
              {/* table */}
              <div style={{overflowY:"auto",flex:1}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead style={{position:"sticky",top:0,background:"var(--color-background-secondary)",zIndex:1}}>
                    <tr>
                      <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--color-text-secondary)",borderBottom:tk.bd,width:"28%"}}>Recipe</th>
                      <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--color-text-secondary)",borderBottom:tk.bd,width:"10%"}}>Meal cat</th>
                      <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--color-text-secondary)",borderBottom:tk.bd,width:"42%"}}>Section tags</th>
                      <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--color-text-secondary)",borderBottom:tk.bd,width:"20%"}}>Goals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(r=>{
                      const d=getCatDraft(r);
                      const isDirty=!!catDrafts[r.id];
                      return (
                        <tr key={r.id} style={{borderBottom:tk.bd,background:isDirty?"#FFFBF5":"transparent"}}>
                          <td style={{padding:"8px 12px",verticalAlign:"middle"}}>
                            <span style={{fontSize:14,marginRight:6}}>{r.emoji}</span>
                            <span style={{fontWeight:isDirty?600:400}}>{r.name}</span>
                          </td>
                          <td style={{padding:"8px 12px",verticalAlign:"middle"}}>
                            <select value={d.cat} onChange={e=>patchDraft(r.id,{cat:e.target.value})}
                              style={{padding:"4px 6px",borderRadius:6,border:tk.bdMed,fontSize:12,background:"var(--color-background-primary)",cursor:"pointer",outline:"none"}}>
                              {["Breakfast","Lunch","Dinner","Snack"].map(c=><option key={c}>{c}</option>)}
                            </select>
                          </td>
                          <td style={{padding:"6px 12px",verticalAlign:"middle"}}>
                            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                              {SECTION_TAGS.map(({label,emoji})=>{
                                const on=d.tags.includes(label);
                                return (
                                  <button key={label} title={label} onClick={()=>patchDraft(r.id,{tags:on?d.tags.filter(t=>t!==label):[...d.tags,label]})}
                                    style={{padding:"2px 6px",borderRadius:20,fontSize:10,cursor:"pointer",border:`1px solid ${on?"#2D5A27":"#ddd"}`,background:on?"#EAF3DE":"transparent",color:on?"#2D5A27":"#aaa",fontWeight:on?600:400}}>
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td style={{padding:"6px 12px",verticalAlign:"middle"}}>
                            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                              {GOALS.map(g=>{
                                const on=d.goal.includes(g.id);
                                return (
                                  <button key={g.id} title={g.label} onClick={()=>patchDraft(r.id,{goal:on?d.goal.filter(x=>x!==g.id):[...d.goal,g.id]})}
                                    style={{padding:"2px 6px",borderRadius:20,fontSize:10,cursor:"pointer",border:`1px solid ${on?"#E8621A":"#ddd"}`,background:on?"#FDEEE6":"transparent",color:on?"#E8621A":"#aaa",fontWeight:on?600:400}}>
                                    {g.icon}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {visible.length===0&&<div style={{textAlign:"center",padding:32,color:"var(--color-text-tertiary)"}}>No recipes match</div>}
                {recipes.filter(r=>!q||r.name.toLowerCase().includes(q)).length>120&&(
                  <div style={{textAlign:"center",padding:12,fontSize:12,color:"var(--color-text-tertiary)"}}>Showing first 120 — use search to narrow</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // ── MEAL BUILDER ─────────────────────────────────────────────────────────────
  if(tab==="builder") return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
          <div>
            <Hdr title="Custom meal builder" sub={`Build any meal from ${ingredients.length} ingredients and get instant macro breakdown · Burnt Calories`}/>
            <div style={crd}>
              <div style={{marginBottom:14}}><label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:5}}>Meal name</label><input value={builderName} onChange={e=>setBuilderName(e.target.value)} placeholder="e.g. Post-workout bowl" style={{width:"100%",boxSizing:"border-box"}}/></div>
              <div style={{marginBottom:12}}><label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:5}}>Find ingredient</label><input value={builderSearch} onChange={e=>setBuilderSearch(e.target.value)} placeholder="Type name, category or subcategory…" style={{width:"100%",boxSizing:"border-box"}}/></div>
              <div style={{maxHeight:300,overflowY:"auto",border:tk.bd,borderRadius:tk.r}}>
                {ingredients.filter(i=>!builderSearch||i.name.toLowerCase().includes(builderSearch.toLowerCase())||i.sub.toLowerCase().includes(builderSearch.toLowerCase())).slice(0,50).map(ing=>(
                  <div key={ing.id} onClick={()=>{if(!builderIngs.find(b=>b.id===ing.id))setBuilderIngs(b=>[...b,{id:ing.id,amt:100}]);}} style={{padding:"9px 14px",borderBottom:tk.bd,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--color-background-secondary)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:500}}>{ing.name}</span><CatBadge cat={ing.cat}/></div>
                    <span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{ing.cal} kcal/{ing.ref}g</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{position:"sticky",top:80}}>
            <div style={crd}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={{fontSize:14,fontWeight:500,margin:0}}>{builderName||"New meal"}</h2>
                {builderIngs.length>0&&<button onClick={()=>{setBuilderIngs([]);setBuilderName("");}} style={{fontSize:11,padding:"4px 10px",cursor:"pointer"}}>Clear all</button>}
              </div>
              {builderIngs.length===0?(
                <div style={{textAlign:"center",padding:"32px 0",color:"var(--color-text-tertiary)",fontSize:12}}>Select ingredients from the left panel</div>
              ):(
                <>
                  {builderIngs.map(bi=>{
                    const ing=BASE_ING.find(i=>i.id===bi.id);
                    if(!ing) return null;
                    const m=ingMacros(bi);
                    return (
                      <div key={bi.id} style={{marginBottom:14,paddingBottom:14,borderBottom:tk.bd}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:500}}>{ing.name}</span>
                          <button onClick={()=>setBuilderIngs(b=>b.filter(x=>x.id!==bi.id))} style={{fontSize:10,padding:"2px 8px",color:tk.red,cursor:"pointer"}}>✕</button>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <input type="range" min={5} max={500} step={5} value={bi.amt} onChange={e=>setBuilderIngs(b=>b.map(x=>x.id===bi.id?{...x,amt:+e.target.value}:x))} style={{flex:1}}/>
                          <span style={{fontSize:11,minWidth:36,color:"var(--color-text-secondary)",textAlign:"right"}}>{bi.amt}g</span>
                          <span style={{fontSize:11,color:tk.teal,minWidth:52,textAlign:"right"}}>{Math.round(m.cal)} kcal</span>
                        </div>
                        <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:4}}>{ing.benefits[0]}</div>
                      </div>
                    );
                  })}
                  <div style={{paddingTop:4}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,textAlign:"center",marginBottom:12}}>
                      {[["Cal",builderTotals.cal,tk.teal],["P",builderTotals.p+"g",tk.blue],["C",builderTotals.c+"g",tk.green],["F",builderTotals.f+"g",tk.coral],["Fibre",builderTotals.fi+"g",tk.gray]].map(([l,v,c])=>(
                        <div key={l}><div style={{fontSize:16,fontWeight:500,color:c}}>{v}</div><div style={{fontSize:9,color:"var(--color-text-tertiary)"}}>{l}</div></div>
                      ))}
                    </div>
                    <div style={{height:4,borderRadius:2,background:"var(--color-background-secondary)",overflow:"hidden",display:"flex"}}>
                      {[[builderTotals.p*4,tk.blue],[builderTotals.c*4,tk.green],[builderTotals.f*9,tk.coral]].map(([kcal,col],i)=>(
                        <div key={i} style={{width:builderTotals.cal>0?Math.round(kcal/builderTotals.cal*100)+"%":"0%",height:"100%",background:col}}/>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── INGREDIENTS ──────────────────────────────────────────────────────────────
  if(tab==="ingredients") return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(<>
        <Hdr title="Master ingredient library" sub={`${ingredients.length} ingredients · calories, macros, fibre · 5 health benefits each · Burnt Calories`}/>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <input value={ingSearch} onChange={e=>setIngSearch(e.target.value)} placeholder="Search ingredients or subcategories…" style={{flex:1,minWidth:200}}/>
          <select value={ingCat} onChange={e=>{setIngCat(e.target.value);setIngSub("All");}} style={{minWidth:150}}>{ingCats.map(c=><option key={c}>{c}</option>)}</select>
          {ingSubs.length>2&&<select value={ingSub} onChange={e=>setIngSub(e.target.value)} style={{minWidth:150}}>{ingSubs.map(s=><option key={s}>{s}</option>)}</select>}
        </div>
        <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:12}}>{filteredIngs.length} ingredients</div>
        <div style={{...crd,padding:0,overflow:"clip"}}>
          <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.55fr 0.65fr 0.55fr 0.55fr 0.55fr 2.8fr",gap:12,padding:"10px 16px",background:"var(--color-background-primary)",fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.08em",position:"sticky",top:isMobile?96:108,zIndex:10,borderBottom:"2px solid #c8c8c8"}}>
            <span>Ingredient</span><span>kcal</span><span>Protein</span><span>Carbs</span><span>Fat</span><span>Fibre</span><span>Top benefits</span>
          </div>
          {filteredIngs.map((ing,i)=>(
            <div key={ing.id} style={{display:"grid",gridTemplateColumns:"2.2fr 0.55fr 0.65fr 0.55fr 0.55fr 0.55fr 2.8fr",gap:12,padding:"10px 16px",borderTop:tk.bd,fontSize:11,alignItems:"center",background:i%2?"var(--color-background-secondary)":"transparent"}}>
              <div><div style={{fontWeight:500}}>{ing.name}</div><div style={{display:"flex",gap:4,marginTop:3}}><CatBadge cat={ing.cat}/><span style={{fontSize:9,color:"var(--color-text-tertiary)"}}>{ing.ref}g ref</span></div></div>
              <span style={{fontWeight:500,color:tk.teal}}>{ing.cal}</span>
              <span style={{color:tk.blue}}>{ing.p}g</span>
              <span style={{color:tk.green}}>{ing.c}g</span>
              <span style={{color:tk.coral}}>{ing.f}g</span>
              <span style={{color:"var(--color-text-secondary)"}}>{ing.fi}g</span>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{ing.benefits.slice(0,2).map((b,bi)=><span key={bi} style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:"var(--color-background-success)",color:"var(--color-text-success)"}}>{b}</span>)}</div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );

  // ── CLIENTS ──────────────────────────────────────────────────────────────────
  if(tab==="clients") {
    const showPanel = (selClient&&clientDraft)||newClientMode;
    const inp2={width:"100%",boxSizing:"border-box",padding:"9px 12px",border:"1px solid #cccccc",borderRadius:tk.r,fontSize:13,background:"var(--color-background-primary)",color:"var(--color-text-primary)"};
    const lbl2={fontSize:12,color:"#4A4A4A",display:"block",marginBottom:5,fontWeight:500};
    const openNewClient=()=>{
      setNewClientMode(true);
      setSelClient(null);
      setClientDraft({id:null,name:"",age:"",weight:"",height:"",gender:"male",goal:"fat_loss",activityLevel:"moderate",notes:""});
      setClientStatus(null);
    };
    return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(
        <div style={{display:"grid",gridTemplateColumns:showPanel?"260px 1fr":"1fr",gap:20,alignItems:"start"}}>
          {/* ── Sidebar ── */}
          <div>
            <Hdr title="Clients" sub={`${clients.length} active clients`}/>
            <button onClick={openNewClient} style={{width:"100%",padding:"11px 14px",marginBottom:12,background:"#E8621A",color:"white",borderRadius:tk.rLg,cursor:"pointer",fontSize:13,fontWeight:600,border:"none",letterSpacing:"0.01em"}}>
              + Add new client
            </button>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {clients.map(c=>{
                const cm=calcMacros({...c,age:String(c.age),weight:String(c.weight),height:String(c.height)});
                const g=GOALS.find(x=>x.id===c.goal);
                const active=selClient?.id===c.id&&!newClientMode;
                return (
                  <div key={c.id} onClick={()=>{setSelClient(selClient?.id===c.id?null:c);setNewClientMode(false);setClientStatus(null);}} style={{...crd,cursor:"pointer",border:active?`2px solid ${tk.teal}`:tk.bd}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}><span style={{fontSize:13,fontWeight:500}}>{c.name}</span><Pill text={`${g?.icon} ${g?.label}`} color={g?.color}/></div>
                    <div style={{fontSize:10,color:"var(--color-text-secondary)",marginBottom:3}}>{c.age}y · {c.weight}kg · {c.height}cm</div>
                    {cm&&<div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{cm.targetCal} kcal · {cm.proteinG}g P · {cm.carbG}g C · {cm.fatG}g F</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Detail panel ── */}
          {showPanel&&clientDraft&&(()=>{
            const cm=clientDraft.age&&clientDraft.weight&&clientDraft.height
              ? calcMacros({...clientDraft,age:String(clientDraft.age),weight:String(clientDraft.weight),height:String(clientDraft.height)})
              : null;
            const saving=clientStatus?.type==='saving';
            return (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={crd}>
                  {/* Header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div>
                      <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 4px",color:"var(--color-text-primary)"}}>
                        {newClientMode?"New client":clientDraft.name}
                      </h2>
                      {cm&&!newClientMode&&<Pill text={`${cm.targetCal} kcal/day`} color={tk.tealText} bg={tk.tealSurf}/>}
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {!newClientMode&&<button onClick={()=>setTab("dashboard")} style={{fontSize:12,padding:"7px 14px",borderRadius:tk.r,cursor:"pointer",border:tk.bdMed,background:"transparent",color:"var(--color-text-secondary)"}}>View dashboard</button>}
                      <button onClick={()=>{setNewClientMode(false);setSelClient(null);setClientDraft(null);setClientStatus(null);}} style={{fontSize:12,padding:"7px 14px",borderRadius:tk.r,cursor:"pointer",border:tk.bdMed,background:"transparent",color:"var(--color-text-secondary)"}}>Cancel</button>
                    </div>
                  </div>

                  {/* Macro stats — only for existing clients with complete data */}
                  {cm&&!newClientMode&&(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:20}}>
                      {[["BMR",cm.bmr,"kcal"],["TDEE",cm.tdee,"kcal"],["Target",cm.targetCal,"kcal"],["Protein",cm.proteinG,"g"],["Fat",cm.fatG,"g"]].map(([l,v,u])=>(
                        <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:tk.r,padding:10,textAlign:"center"}}><div style={{fontSize:15,fontWeight:600}}>{v}{u}</div><div style={{fontSize:9,color:"var(--color-text-secondary)",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div></div>
                      ))}
                    </div>
                  )}

                  {/* Editable form */}
                  <h3 style={{fontSize:13,fontWeight:600,marginBottom:14,paddingTop:newClientMode?0:16,borderTop:newClientMode?"none":tk.bd}}>Client details</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={lbl2}>Full name</label>
                      <input value={clientDraft.name} onChange={e=>setClientDraft(d=>({...d,name:e.target.value}))} placeholder="e.g. Sarah Mitchell" style={inp2}/>
                    </div>
                    {[{k:"age",l:"Age (yrs)",ph:"32"},{k:"weight",l:"Weight (kg)",ph:"68"},{k:"height",l:"Height (cm)",ph:"165"}].map(({k,l,ph})=>(
                      <div key={k}>
                        <label style={lbl2}>{l}</label>
                        <input type="number" min={0} value={clientDraft[k]} onChange={e=>setClientDraft(d=>({...d,[k]:e.target.value}))} placeholder={ph} style={inp2}/>
                      </div>
                    ))}
                    <div>
                      <label style={lbl2}>Gender</label>
                      <div style={{display:"flex",gap:8}}>
                        {["male","female"].map(g=>(
                          <button key={g} onClick={()=>setClientDraft(d=>({...d,gender:g}))} style={{flex:1,padding:"9px 0",borderRadius:tk.r,cursor:"pointer",fontSize:13,fontWeight:clientDraft.gender===g?600:400,background:clientDraft.gender===g?tk.teal:"transparent",color:clientDraft.gender===g?"white":"var(--color-text-primary)",border:clientDraft.gender===g?`1px solid ${tk.teal}`:"1px solid #cccccc"}}>
                            {g==="male"?"♂ Male":"♀ Female"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={lbl2}>Activity level</label>
                      <select value={clientDraft.activityLevel} onChange={e=>setClientDraft(d=>({...d,activityLevel:e.target.value}))} style={inp2}>
                        {ACTIVITY.map(a=><option key={a.id} value={a.id}>{a.label} — {a.desc}</option>)}
                      </select>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={lbl2}>Primary goal</label>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                        {GOALS.map(g=>(
                          <button key={g.id} onClick={()=>setClientDraft(d=>({...d,goal:g.id}))} style={{padding:"10px 8px",borderRadius:tk.r,border:clientDraft.goal===g.id?`2px solid ${g.color}`:tk.bd,background:clientDraft.goal===g.id?g.color+"15":"transparent",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
                            <div style={{fontSize:18,marginBottom:3}}>{g.icon}</div>
                            <div style={{fontSize:11,fontWeight:clientDraft.goal===g.id?600:400}}>{g.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={lbl2}>Notes</label>
                      <textarea value={clientDraft.notes||""} onChange={e=>setClientDraft(d=>({...d,notes:e.target.value}))} placeholder="Training notes, dietary restrictions, preferences…" rows={3} style={{...inp2,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}}/>
                    </div>
                  </div>

                  {/* Status message */}
                  {clientStatus&&(
                    <div style={{marginTop:12,padding:"9px 14px",borderRadius:tk.r,fontSize:13,fontWeight:500,
                      background:clientStatus.type==='ok'?"#EAF3E6":clientStatus.type==='err'?"#FEF0F0":"var(--color-background-secondary)",
                      color:clientStatus.type==='ok'?"#243D1F":clientStatus.type==='err'?"#991111":"var(--color-text-secondary)"}}>
                      {clientStatus.msg}
                    </div>
                  )}

                  <button onClick={saveClient} disabled={saving} style={{width:"100%",marginTop:14,padding:"13px",borderRadius:tk.rLg,cursor:saving?"default":"pointer",border:"none",background:saving?"#ccc":tk.coral,color:"white",fontWeight:600,fontSize:14,transition:"background 0.15s"}}>
                    {saving?"Saving…":newClientMode?"Save new client":"Save changes"}
                  </button>
                  {!newClientMode&&clientDraft.id&&(
                    <button onClick={()=>deleteClient(clientDraft.id)} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:tk.rLg,cursor:"pointer",border:"1px solid #E24B4A",background:"transparent",color:"#E24B4A",fontWeight:500,fontSize:13}}>
                      Delete client
                    </button>
                  )}
                </div>

                {/* Recommended recipes — only for existing clients */}
                {!newClientMode&&(
                  <div style={crd}>
                    <h3 style={{fontSize:13,fontWeight:500,marginBottom:12}}>Recommended recipes for {clientDraft.name}</h3>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                      {recipes.filter(r=>parseArr(r.goal).includes(clientDraft.goal)).slice(0,4).map(r=><RecipeCard key={r.id} recipe={r} selected={selRecipe?.id===r.id} onSelect={r=>setSelRecipe(selRecipe?.id===r.id?null:r)}/>)}
                    </div>
                    {selRecipe&&<RecipeDetail recipe={selRecipe} onClose={()=>setSelRecipe(null)} onUpdate={updateRecipe} allIngredients={ingredients}/>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );}

  // ── MEAL PLANS ───────────────────────────────────────────────────────────────
  if(tab==="plans") {
    const planSubjects=[
      {id:'me',...profile,displayName:profile.name+' (me)',age:+profile.age||0,weight:+profile.weight||0,height:+profile.height||0},
      ...clients.map(c=>({...c,displayName:c.name})),
    ];
    const selSubject=planSubjects.find(s=>s.id===planClientId)||null;
    const selMacros=selSubject?calcMacros({...selSubject,age:String(selSubject.age),weight:String(selSubject.weight),height:String(selSubject.height)}):null;
    const shoppingList=currentPlan?buildShoppingList(currentPlan,recipes,ingredients):[];
    const shoppingGrouped=shoppingList.reduce((acc,item)=>({...acc,[item.cat]:[...(acc[item.cat]||[]),item]}),{});

    async function handleGenerate() {
      if(!selSubject||!selMacros) return;
      setPlanSwapTarget(null);
      setPlanSwapSearch('');
      const freshRecs=await fetchAllRecipes();
      const recs=freshRecs.length?freshRecs.map(normalizeRecipe):recipes;
      if(freshRecs?.length) setRecipes(recs);
      setCurrentPlan(generateWeeklyPlan(selSubject,recs));
      setPlanView('plan');
    }
    function swapMeal(di,mi,newId){
      setCurrentPlan(prev=>({...prev,days:prev.days.map((day,d)=>d!==di?day:{...day,meals:day.meals.map((meal,m)=>m!==mi?meal:{...meal,recipeId:newId})})}));
      setPlanSwapTarget(null); setPlanSwapSearch('');
    }
    function removeMeal(di,mi){
      setCurrentPlan(prev=>({...prev,days:prev.days.map((day,d)=>d!==di?day:{...day,meals:day.meals.map((meal,m)=>m!==mi?meal:{...meal,recipeId:null})})}));
    }
    function setMealNote(di,mi,note){
      setCurrentPlan(prev=>({...prev,days:prev.days.map((day,d)=>d!==di?day:{...day,meals:day.meals.map((meal,m)=>m!==mi?meal:{...meal,note})})}));
    }
    function setPlanNotes(notes){ setCurrentPlan(prev=>({...prev,notes})); }

    function handlePrintShopping() {
      const grouped=shoppingGrouped;
      const rowsHtml=Object.entries(grouped).map(([cat,items])=>
        `<tr><td colspan="3" style="padding:10px 8px 4px;font-size:11px;font-weight:700;color:#2D5A27;text-transform:uppercase;letter-spacing:0.07em;background:#EAF3DE;border-top:1px solid #C0DD97">${cat}</td></tr>`+
        items.map(item=>`<tr><td style="padding:6px 8px;font-size:13px">${item.name}</td><td style="padding:6px 8px;font-size:13px;color:#555;text-align:right">${item.totalAmt}g</td><td style="padding:6px 8px;font-size:11px;color:#999">${item.recipeNames.slice(0,2).join(', ')}${item.recipeNames.length>2?'…':''}</td></tr>`).join('')
      ).join('');
      const goalInfo=GOALS.find(g=>g.id===selSubject?.goal);
      const w=window.open('','_blank','width=700,height=900');
      w.document.write(`<!DOCTYPE html><html><head><title>Shopping list — ${selSubject?.displayName}</title>
        <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a}h1{font-size:22px;margin:0 0 4px}p{font-size:12px;color:#888;margin:0 0 24px}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #f0f0f0}.logo{margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#999}@media print{button{display:none}}</style>
        </head><body>
        <h1>Weekly shopping list</h1>
        <p>${selSubject?.displayName} · ${goalInfo?.label||''} · ${selMacros?.targetCal||''} kcal/day · 7-day plan · Burnt Calories</p>
        ${currentPlan?.notes?`<p style="background:#EAF3DE;padding:10px 14px;border-radius:6px;color:#2D5A27;font-size:12px"><strong>Kitchen notes:</strong> ${currentPlan.notes}</p>`:''}
        <table>${rowsHtml}</table>
        <div class="logo"><strong style="color:#E8621A">Burnt Calories</strong> — burntcalories.com</div>
        <div style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 24px;background:#E8621A;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">Print / Save PDF</button></div>
        </body></html>`);
      w.document.close();
    }

    return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(
        <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:20,alignItems:"start"}}>

          {/* ── Sidebar: client list ── */}
          <div>
            <Hdr title="Meal plans" sub="Auto-generate 7-day plans"/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {planSubjects.map(s=>{
                const sm=calcMacros({...s,age:String(s.age),weight:String(s.weight),height:String(s.height)});
                const g=GOALS.find(x=>x.id===s.goal);
                const active=planClientId===s.id;
                return (
                  <div key={s.id} onClick={()=>{setPlanClientId(s.id);setCurrentPlan(null);setPlanView('plan');}}
                    style={{...crd,cursor:"pointer",padding:"12px 14px",border:active?`2px solid ${tk.teal}`:tk.bd}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{s.displayName}</div>
                    {sm&&<div style={{fontSize:10,color:"var(--color-text-secondary)"}}>{sm.targetCal} kcal · {sm.proteinG}g P</div>}
                    {g&&<div style={{marginTop:4}}><Pill text={`${g.icon} ${g.label}`} color={g.color}/></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Main content ── */}
          <div>
            {!selSubject&&(
              <div style={{...crd,textAlign:"center",padding:60}}>
                <div style={{fontSize:36,marginBottom:12}}>📅</div>
                <p style={{color:"var(--color-text-secondary)",fontSize:13}}>Select a client to generate their personalised 7-day meal plan.</p>
              </div>
            )}

            {selSubject&&!currentPlan&&selMacros&&(
              <div style={{...crd,maxWidth:560}}>
                <h2 style={{fontSize:16,fontWeight:600,margin:"0 0 4px"}}>{selSubject.displayName}</h2>
                <p style={{fontSize:12,color:"var(--color-text-secondary)",margin:"0 0 20px"}}>{selSubject.age}y · {selSubject.weight}kg · {GOALS.find(g=>g.id===selSubject.goal)?.label}</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
                  {[["Daily calories",selMacros.targetCal+" kcal",tk.teal],["Protein",selMacros.proteinG+"g",tk.blue],["Carbs",selMacros.carbG+"g",tk.green],["Fat",selMacros.fatG+"g",tk.coral]].map(([l,v,c])=>(
                    <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:tk.r,padding:"12px 10px",textAlign:"center"}}>
                      <div style={{fontSize:18,fontWeight:600,color:c}}>{v}</div>
                      <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"12px 16px",background:"#EAF3DE",borderRadius:tk.r,marginBottom:20,fontSize:12,color:"#2D5A27"}}>
                  Recipes will be matched to <strong>{selSubject.displayName}'s</strong> goal and rotated for variety across all 7 days.
                </div>
                <button onClick={handleGenerate} style={{width:"100%",height:48,borderRadius:40,border:"none",background:"#E8621A",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 12px rgba(232,98,26,0.30)"}}>
                  Generate 7-day plan
                </button>
              </div>
            )}

            {currentPlan&&(
              <div>
                {/* Header bar */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <h2 style={{fontSize:16,fontWeight:600,margin:0}}>{selSubject?.displayName} — 7-day plan</h2>
                    {selMacros&&<Pill text={`${selMacros.targetCal} kcal/day target`} color={tk.tealText} bg={tk.tealSurf}/>}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button onClick={handleGenerate} style={{padding:"8px 16px",borderRadius:40,fontSize:12,cursor:"pointer",background:"#E8621A",color:"white",border:"none",fontWeight:600,boxShadow:"0 2px 8px rgba(232,98,26,0.25)"}}>🔄 Generate new plan</button>
                    <button onClick={()=>{setCurrentPlan(null);setPlanSwapTarget(null);}} style={{padding:"7px 14px",borderRadius:tk.r,fontSize:12,cursor:"pointer",border:tk.bdMed,background:"transparent",color:"var(--color-text-secondary)"}}>✕ Clear plan</button>
                    <button onClick={()=>setPlanView(v=>v==='plan'?'shopping':'plan')} style={{padding:"7px 14px",borderRadius:tk.r,fontSize:12,cursor:"pointer",border:`1px solid ${tk.teal}`,background:planView==='shopping'?tk.teal:"transparent",color:planView==='shopping'?"white":tk.teal,fontWeight:500}}>
                      {planView==='plan'?'🛒 Shopping list':'📅 Meal plan'}
                    </button>
                    {planView==='shopping'&&<button onClick={handlePrintShopping} style={{padding:"7px 14px",borderRadius:tk.r,fontSize:12,cursor:"pointer",background:"#E8621A",color:"white",border:"none",fontWeight:500}}>🖨 Print / Order</button>}
                  </div>
                </div>

                {/* ── Plan view ── */}
                {/* ── Swap modal ── */}
                {planSwapTarget&&(()=>{
                  const slot=MEAL_SLOTS[planSwapTarget.mi];
                  const currentMeal=currentPlan.days[planSwapTarget.di]?.meals[planSwapTarget.mi];
                  const validForSlot=recipes.filter(rec=>{
                    const tot=recipeTotals(rec);
                    if(tot.cal===0||tot.cal>900||tot.p>120) return false;
                    if(tot.cal<50&&!parseArr(rec.tags).includes('Bone Broth')) return false;
                    if(tot.c>200) return false;
                    return rec.cat===slot.cat;
                  });
                  const filtered=planSwapSearch
                    ?validForSlot.filter(rec=>rec.name.toLowerCase().includes(planSwapSearch.toLowerCase()))
                    :validForSlot;
                  return (
                    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
                      onClick={()=>{setPlanSwapTarget(null);setPlanSwapSearch('');}}>
                      <div style={{background:"var(--color-background-primary)",borderRadius:tk.rLg,padding:24,width:500,maxWidth:"92vw",maxHeight:"82vh",display:"flex",flexDirection:"column",gap:14,boxShadow:"0 8px 40px rgba(0,0,0,0.25)"}}
                        onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:600,marginBottom:2}}>Swap {slot.label}</div>
                            <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{DAYS_OF_WEEK[planSwapTarget.di]} · pick a {slot.cat.toLowerCase()} recipe</div>
                          </div>
                          <button onClick={()=>{setPlanSwapTarget(null);setPlanSwapSearch('');}}
                            style={{fontSize:20,lineHeight:1,border:"none",background:"transparent",cursor:"pointer",color:"var(--color-text-secondary)",padding:"0 4px"}}>×</button>
                        </div>
                        <input autoFocus value={planSwapSearch} onChange={e=>setPlanSwapSearch(e.target.value)}
                          placeholder={`Search ${slot.cat.toLowerCase()} recipes…`}
                          style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:tk.bdMed,boxSizing:"border-box",outline:"none"}}/>
                        <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:8,flex:1,minHeight:0}}>
                          {filtered.slice(0,8).map(rec=>{
                            const tm=recipeTotals(rec);
                            const isCurrent=rec.id===currentMeal?.recipeId;
                            return (
                              <div key={rec.id}
                                onClick={()=>swapMeal(planSwapTarget.di,planSwapTarget.mi,rec.id)}
                                style={{padding:"11px 14px",borderRadius:10,cursor:"pointer",border:isCurrent?`2px solid #2D5A27`:tk.bd,background:isCurrent?"#EAF3DE":"var(--color-background-secondary)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}
                                onMouseOver={e=>e.currentTarget.style.background="#EAF3DE"}
                                onMouseOut={e=>e.currentTarget.style.background=isCurrent?"#EAF3DE":"var(--color-background-secondary)"}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{rec.emoji} {rec.name}</div>
                                  <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>
                                    {tm.cal} kcal · <span style={{color:tk.blue}}>{tm.p}g P</span> · {tm.c}g C · {tm.f}g F
                                  </div>
                                </div>
                                {isCurrent&&<span style={{fontSize:10,color:"#2D5A27",fontWeight:600,whiteSpace:"nowrap"}}>Current</span>}
                              </div>
                            );
                          })}
                          {filtered.length===0&&<div style={{fontSize:13,color:"var(--color-text-tertiary)",textAlign:"center",padding:24}}>No recipes found</div>}
                          {filtered.length>8&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",textAlign:"center",paddingTop:4}}>+{filtered.length-8} more — refine search above</div>}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {planView==='plan'&&(()=>{
                  function SlotCard({meal,mi,di}){
                    const slot=MEAL_SLOTS[mi];
                    const r=recipes.find(x=>x.id===meal.recipeId);
                    const m=r?recipeTotals(r):null;
                    return (
                      <div style={{background:"var(--color-background-secondary)",borderRadius:tk.r,padding:"7px 9px"}}>
                        <div style={{fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{slot.label}</div>
                        {r?(
                          <>
                            <div style={{fontSize:11,fontWeight:500,lineHeight:1.3,marginBottom:2}}>{r.emoji} {r.name}</div>
                            <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:5}}>{m.cal} kcal · <span style={{color:tk.blue}}>{m.p}g P</span></div>
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={()=>{setPlanSwapTarget({di,mi});setPlanSwapSearch('');}}
                                style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:`1px solid ${tk.teal}`,background:"transparent",color:tk.teal,cursor:"pointer"}}>⇄ Swap</button>
                              <button onClick={()=>removeMeal(di,mi)}
                                style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:"1px solid #E24B4A",background:"transparent",color:"#E24B4A",cursor:"pointer"}}>× Remove</button>
                            </div>
                          </>
                        ):(
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                            <div style={{fontSize:11,color:"var(--color-text-tertiary)",fontStyle:"italic"}}>No recipe</div>
                            <button onClick={()=>{setPlanSwapTarget({di,mi});setPlanSwapSearch('');}}
                              style={{fontSize:9,padding:"2px 7px",borderRadius:4,border:`1px solid ${tk.teal}`,background:"transparent",color:tk.teal,cursor:"pointer"}}>+ Add</button>
                          </div>
                        )}
                        <input value={meal.note||''} onChange={e=>setMealNote(di,mi,e.target.value)}
                          placeholder="📝 note…"
                          style={{width:"100%",marginTop:4,fontSize:10,padding:"2px 5px",borderRadius:4,border:meal.note?`1px solid ${tk.teal}`:"1px solid transparent",background:meal.note?"var(--color-background-primary)":"transparent",color:"var(--color-text-secondary)",boxSizing:"border-box",outline:"none"}}
                          onFocus={e=>e.target.style.border=`1px solid ${tk.teal}`}
                          onBlur={e=>{if(!meal.note)e.target.style.border="1px solid transparent";}}/>
                      </div>
                    );
                  }
                  function DayCard({day,di}){
                    let dayCal=0,dayP=0,dayC=0,dayF=0;
                    day.meals.forEach(meal=>{
                      const r=recipes.find(x=>x.id===meal.recipeId);
                      if(r){const mm=recipeTotals(r);dayCal+=mm.cal;dayP+=mm.p;dayC+=mm.c;dayF+=mm.f;}
                    });
                    const pct=selMacros?Math.min(100,Math.round(dayCal/selMacros.targetCal*100)):0;
                    return (
                      <div style={{...crd,padding:0,overflow:"hidden"}}>
                        <div style={{background:"#2D5A27",padding:"8px 12px"}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#fff",letterSpacing:"0.05em"}}>{day.day.toUpperCase()}</div>
                        </div>
                        <div style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:6}}>
                          {day.meals.map((meal,mi)=><SlotCard key={mi} meal={meal} mi={mi} di={di}/>)}
                        </div>
                        <div style={{padding:"8px 10px",borderTop:tk.bd}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--color-text-secondary)",marginBottom:5}}>
                            <span>{Math.round(dayCal)} kcal</span>
                            <span>{pct}% of target</span>
                          </div>
                          <div style={{height:4,background:"var(--color-background-secondary)",borderRadius:2}}>
                            <div style={{height:"100%",width:pct+"%",background:pct>=85&&pct<=115?"#2D5A27":pct<70?"#E24B4A":"#C47C0A",borderRadius:2,transition:"width 0.3s"}}/>
                          </div>
                          <div style={{display:"flex",gap:8,marginTop:5,fontSize:9,color:"var(--color-text-tertiary)"}}>
                            <span style={{color:tk.blue}}>{Math.round(dayP)}P</span>
                            <span style={{color:tk.green}}>{Math.round(dayC)}C</span>
                            <span style={{color:tk.coral}}>{Math.round(dayF)}F</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {/* Plan-level kitchen notes */}
                      <div style={{...crd,padding:"12px 16px"}}>
                        <label style={{fontSize:11,fontWeight:600,color:"#2D5A27",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Kitchen notes for this plan</label>
                        <textarea value={currentPlan.notes||''} onChange={e=>setPlanNotes(e.target.value)}
                          placeholder="e.g. No dairy · Extra rice on training days · Client prefers mild spice"
                          rows={2}
                          style={{width:"100%",fontSize:12,padding:"8px 10px",borderRadius:6,border:tk.bdMed,resize:"vertical",fontFamily:"inherit",color:"var(--color-text-primary)",background:"var(--color-background-secondary)",outline:"none",boxSizing:"border-box"}}
                          onFocus={e=>e.target.style.border=`1px solid #2D5A27`}
                          onBlur={e=>e.target.style.border=tk.bdMed}/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                        {currentPlan.days.slice(0,4).map((day,di)=><DayCard key={di} day={day} di={di}/>)}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                        {currentPlan.days.slice(4,7).map((day,di)=><DayCard key={di+4} day={day} di={di+4}/>)}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Shopping list view ── */}
                {planView==='shopping'&&(
                  <div style={{...crd}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <div>
                        <h3 style={{fontSize:14,fontWeight:600,margin:"0 0 2px",color:"#2D5A27"}}>Weekly shopping list</h3>
                        <p style={{fontSize:11,color:"var(--color-text-secondary)",margin:0}}>{shoppingList.length} ingredients across {currentPlan.days.length * MEAL_SLOTS.length} meals</p>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>{const txt=shoppingList.map(i=>`${i.name} — ${i.totalAmt}g`).join('\n');navigator.clipboard.writeText(txt);}} style={{padding:"6px 12px",borderRadius:tk.r,fontSize:12,cursor:"pointer",border:tk.bdMed,background:"transparent",color:"var(--color-text-secondary)"}}>Copy</button>
                        <button onClick={handlePrintShopping} style={{padding:"6px 12px",borderRadius:tk.r,fontSize:12,cursor:"pointer",background:"#E8621A",color:"white",border:"none",fontWeight:500}}>🖨 Print / Order</button>
                      </div>
                    </div>
                    {Object.entries(shoppingGrouped).map(([cat,items])=>(
                      <div key={cat} style={{marginBottom:16}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#2D5A27",textTransform:"uppercase",letterSpacing:"0.07em",padding:"6px 0",borderBottom:`2px solid #C0DD97`,marginBottom:8}}>{cat}</div>
                        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 3fr",gap:6}}>
                          {items.map(item=>(
                            <div key={item.id} style={{display:"contents"}}>
                              <span style={{fontSize:13,fontWeight:500}}>{item.name}</span>
                              <span style={{fontSize:13,color:"#2D5A27",fontWeight:600,textAlign:"right"}}>{item.totalAmt}g</span>
                              <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{item.recipeNames.slice(0,3).join(', ')}{item.recipeNames.length>3?'…':''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );}

  // ── WORKOUTS ─────────────────────────────────────────────────────────────────
  if(tab==="workouts") return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(<>
        <Hdr title="Workout protocols" sub="Burnt Calories 6-day training split · 3×12 · 60–70% 1RM · 2 min rest · Burnt Calories performance program"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
          {WORKOUTS.map(d=>(
            <div key={d.day} style={crd}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <span style={{fontSize:20}}>{d.emoji}</span>
                <div><div style={{fontSize:10,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{d.day}</div><div style={{fontSize:14,fontWeight:500,marginTop:1}}>{d.focus}</div></div>
              </div>
              <div style={{borderTop:tk.bd}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 0.55fr 0.6fr",gap:8,padding:"7px 0",fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.07em"}}><span>Exercise</span><span>Volume</span><span>Intensity</span></div>
                {d.exs.map(([ex,reps,intens,note],i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 0.55fr 0.6fr",gap:8,padding:"8px 0",borderTop:tk.bd,fontSize:11}}>
                    <div><div style={{fontWeight:500,lineHeight:1.25}}>{ex}</div>{note&&<div style={{fontSize:9,color:"var(--color-text-tertiary)",marginTop:2}}>{note}</div>}</div>
                    <span style={{color:"var(--color-text-secondary)"}}>{reps}</span>
                    <span style={{color:tk.blue,fontSize:10}}>{intens}</span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,padding:"7px 10px",background:"var(--color-background-secondary)",borderRadius:tk.r,fontSize:9,color:"var(--color-text-tertiary)"}}>2 min rest · supersets: no rest between paired exercises</div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );

  return null;
}
