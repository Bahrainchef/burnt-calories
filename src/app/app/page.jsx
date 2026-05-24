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
  teal:"#E8621A", tealSurf:"#FDEEE6", tealText:"#7A2B07",
  blue:"#4A7C3F", blueSurf:"#EAF3E6", blueText:"#243D1F",
  coral:"#D85A30", coralSurf:"#FAECE7",
  amber:"#C47C0A", amberSurf:"#FDF3DC",
  green:"#4A7C3F", greenSurf:"#EAF3E6",
  purple:"#7F77DD", purpleSurf:"#EEEDFE",
  red:"#E24B4A", gray:"#888780",
  bd:"0.5px solid var(--color-border-tertiary)",
  bdMed:"0.5px solid var(--color-border-secondary)",
  r:"var(--border-radius-md)", rLg:"var(--border-radius-lg)", rXl:"var(--border-radius-xl)",
};
const card = { background:"var(--color-background-primary)", border:tk.bd, borderRadius:tk.rLg, padding:20 };
const CAT_C = { Protein:tk.blue, Dairy:tk.purple, Carbohydrate:tk.teal, Vegetable:tk.green, Fat:tk.coral, Fruit:tk.amber, Spice:tk.red, Herb:tk.teal, Other:tk.gray };
const CAT_S = { Protein:tk.blueSurf, Dairy:tk.purpleSurf, Carbohydrate:tk.tealSurf, Vegetable:tk.greenSurf, Fat:tk.coralSurf, Fruit:tk.amberSurf, Spice:"#FEF0F0", Herb:tk.tealSurf, Other:"#F1EFE8" };

// ─── Master ingredient database ────────────────────────────────────────────────
const BASE_ING = [
  // PROTEINS — POULTRY
  {id:1,  name:"Chicken Breast",           cat:"Protein", sub:"Poultry",    ref:100, cal:165, p:31,  c:0,   f:3.6, fi:0,   benefits:["Leanest muscle-building protein","Niacin & B6 energy metabolism","Very low saturated fat","High bioavailability amino acids","High bioavailability complete protein"]},
  {id:2,  name:"Chicken Thigh (skinless)", cat:"Protein", sub:"Poultry",    ref:100, cal:177, p:25,  c:0,   f:8.3, fi:0,   benefits:["Richer flavour aids adherence","Zinc & iron for immunity","More forgiving to cook","Higher calories for bulking","Juicier texture"]},
  {id:3,  name:"Turkey Breast",            cat:"Protein", sub:"Poultry",    ref:100, cal:135, p:30,  c:0,   f:1,   fi:0,   benefits:["Leanest available poultry","Tryptophan for serotonin & sleep","Selenium antioxidant","Niacin energy metabolism","Phosphorus for bones"]},
  {id:4,  name:"Turkey Mince (lean)",      cat:"Protein", sub:"Poultry",    ref:100, cal:149, p:29,  c:0,   f:2,   fi:0,   benefits:["Bolognese & kofta base","Low saturated fat","B12 & zinc rich","Digestive friendly","Meal prep hero"]},
  // PROTEINS — BEEF
  {id:5,  name:"Rump Steak",               cat:"Protein", sub:"Beef",       ref:100, cal:197, p:28,  c:0,   f:9,   fi:0,   benefits:["Haem iron for oxygen transport","Zinc for testosterone","Creatine precursor","B12 energy","Performance nutrition staple"]},
  {id:6,  name:"Sirloin Steak",            cat:"Protein", sub:"Beef",       ref:100, cal:207, p:26,  c:0,   f:11,  fi:0,   benefits:["Premium lean cut","CLA anti-inflammatory fat","Phosphorus for bones","Niacin metabolism","Restaurant quality"]},
  {id:7,  name:"Ribeye Steak",             cat:"Protein", sub:"Beef",       ref:100, cal:291, p:24,  c:0,   f:21,  fi:0,   benefits:["Highest flavour beef cut","Rich in CLA anti-inflammatory","Saturated fat hormone support","B12 & zinc dense","Restaurant premium centrepiece"]},
  {id:8,  name:"Eye Fillet (Tenderloin)",  cat:"Protein", sub:"Beef",       ref:100, cal:174, p:28,  c:0,   f:6,   fi:0,   benefits:["Leanest premium beef cut","Tender easy digestion","High zinc & iron","Leucine for muscle synthesis","Low fat luxury"]},
  {id:9,  name:"Beef Mince (5% fat)",      cat:"Protein", sub:"Beef",       ref:100, cal:137, p:21,  c:0,   f:5.5, fi:0,   benefits:["Budget versatile protein","Haem iron high","B-vitamin complex","Meal prep base","Bolognese & burger use"]},
  {id:10, name:"Beef Mince (20% fat)",     cat:"Protein", sub:"Beef",       ref:100, cal:215, p:18,  c:0,   f:15,  fi:0,   benefits:["Calorie dense for muscle gain","Rich flavour","Saturated fat for hormones","Zinc & selenium","Bulking phase suitable"]},
  // PROTEINS — LAMB
  {id:11, name:"Lamb Leg (lean)",          cat:"Protein", sub:"Lamb",       ref:100, cal:191, p:28,  c:0,   f:8.8, fi:0,   benefits:["B12 very high","Haem iron absorption","CLA anti-inflammatory","Grass-fed omega-3","Arabic cuisine essential"]},
  {id:12, name:"Lamb Mince",               cat:"Protein", sub:"Lamb",       ref:100, cal:262, p:21,  c:0,   f:19,  fi:0,   benefits:["Kofta & kebab base","B12 rich","Selenium antioxidant","High calorie for bulking","Gulf region staple"]},
  {id:13, name:"Lamb Shoulder",            cat:"Protein", sub:"Lamb",       ref:100, cal:219, p:25,  c:0,   f:13,  fi:0,   benefits:["Slow-cook collagen release","Glycine for joints","Zinc immunity","Iron rich","Traditional Middle Eastern"]},
  // PROTEINS — SEAFOOD
  {id:14, name:"Salmon (Atlantic)",        cat:"Protein", sub:"Seafood",    ref:100, cal:208, p:20,  c:0,   f:13,  fi:0,   benefits:["Omega-3 EPA/DHA highest","Anti-inflammatory potent","Brain & heart health","Vitamin D source","Astaxanthin antioxidant"]},
  {id:15, name:"Barramundi",               cat:"Protein", sub:"Seafood",    ref:100, cal:97,  p:20,  c:0,   f:1.8, fi:0,   benefits:["Very lean white fish","Sustainable catch","Mild flavour","Gulf region popular","Omega-3 moderate"]},
  {id:16, name:"Tuna (canned, water)",     cat:"Protein", sub:"Seafood",    ref:100, cal:116, p:26,  c:0,   f:1,   fi:0,   benefits:["Portable convenience protein","Selenium antioxidant","Omega-3 EPA/DHA","Low calorie dense","Post-workout convenient option"]},
  {id:17, name:"Tuna Steak (fresh)",       cat:"Protein", sub:"Seafood",    ref:100, cal:130, p:29,  c:0,   f:1.3, fi:0,   benefits:["Leanest premium fish","Potassium electrolyte","Niacin energy","B6 protein metabolism","Restaurant centrepiece"]},
  {id:18, name:"Snapper (fillet)",         cat:"Protein", sub:"Seafood",    ref:100, cal:100, p:20,  c:0,   f:1.3, fi:0,   benefits:["Gulf & Indian Ocean catch","Magnesium source","Omega-3 moderate","Mild white fish","Anti-inflammatory"]},
  {id:19, name:"Prawns (king)",            cat:"Protein", sub:"Seafood",    ref:100, cal:99,  p:21,  c:0.9, f:0.9, fi:0,   benefits:["Extremely lean luxury protein","Iodine thyroid health","Astaxanthin antioxidant","Low calorie","Phosphorus bone health"]},
  // EGGS & DAIRY
  {id:20, name:"Whole Egg",                cat:"Protein", sub:"Eggs",       ref:60,  cal:90,  p:7,   c:0.6, f:6,   fi:0,   benefits:["Complete amino acid profile","Choline brain & liver health","Lutein eye health","Vitamin D & B12","Best bioavailability protein"]},
  {id:21, name:"Egg White",                cat:"Protein", sub:"Eggs",       ref:100, cal:52,  p:11,  c:0.7, f:0.2, fi:0,   benefits:["Pure albumin zero fat","Fast absorption","Low calorie","Complete amino acids","High protein breakfast essential"]},
  {id:22, name:"Whey Protein Isolate",     cat:"Protein", sub:"Supplements",ref:30,  cal:110, p:25,  c:1,   f:0.5, fi:0,   benefits:["Fastest muscle absorption","BCAA leucine rich","Post-workout essential","Minimal lactose","Muscle protein synthesis"]},
  // DAIRY — expanded
  {id:23, name:"Greek Yogurt (0% fat)",    cat:"Dairy",   sub:"Yogurt",     ref:100, cal:59,  p:10,  c:3.6, f:0.4, fi:0,   benefits:["Live probiotic cultures","Gut microbiome support","Calcium bone density","Casein slow-release protein","Immune system support"]},
  {id:24, name:"Greek Yogurt (full fat)",  cat:"Dairy",   sub:"Yogurt",     ref:100, cal:97,  p:9,   c:3.8, f:5,   fi:0,   benefits:["Higher fat for satiety","CLA anti-inflammatory","Probiotic cultures","Calcium & B12","Hormone support healthy fats"]},
  {id:25, name:"Cottage Cheese (low fat)", cat:"Dairy",   sub:"Cheese",     ref:100, cal:98,  p:11,  c:3.4, f:4.3, fi:0,   benefits:["Casein overnight muscle repair","Night-time protein ideal","Calcium & phosphorus","High satiety low calorie","Ideal night-time protein snack"]},
  {id:26, name:"Cream Cheese (lite)",      cat:"Dairy",   sub:"Cheese",     ref:30,  cal:69,  p:3.3, c:2.1, f:5.5, fi:0,   benefits:["Lower fat cream cheese","Calcium source","Spreads & sauces use","Protein moderate","Cooking flexibility"]},
  {id:27, name:"Whipping Cream",           cat:"Dairy",   sub:"Cream",      ref:30,  cal:103, p:0.6, c:0.8, f:11,  fi:0,   benefits:["Calorie dense bulking aid","Fat-soluble vitamin carrier","Sauces & desserts","CLA source","Keto & high-fat protocols"]},
  {id:28, name:"Milk (full fat)",          cat:"Dairy",   sub:"Milk",       ref:240, cal:149, p:8,   c:12,  f:8,   fi:0,   benefits:["Calcium & D combo","Casein + whey blend","Electrolyte recovery","B12 source","Bulking calorie density"]},
  {id:29, name:"Milk (low fat 2%)",        cat:"Dairy",   sub:"Milk",       ref:240, cal:122, p:8,   c:12,  f:5,   fi:0,   benefits:["Balanced protein & carb","Calcium bone health","Lower calorie than full fat","B vitamins","Post-workout option"]},
  {id:30, name:"Milk (skim)",              cat:"Dairy",   sub:"Milk",       ref:240, cal:83,  p:8,   c:12,  f:0.2, fi:0,   benefits:["Lowest fat dairy","High protein to calorie ratio","Calcium & potassium","B12 source","Fat loss protocols"]},
  // CARBS — RICE
  {id:31, name:"Brown Rice",               cat:"Carbohydrate", sub:"Rice",   ref:100, cal:123, p:2.6, c:26,  f:0.9, fi:1.8, benefits:["Complex sustained energy","Manganese source","Selenium antioxidant","Gluten-free naturally","Performance nutrition rice choice"]},
  {id:32, name:"White Rice (long grain)",  cat:"Carbohydrate", sub:"Rice",   ref:100, cal:130, p:2.7, c:28,  f:0.3, fi:0.4, benefits:["Fast glycogen replenishment","Easy digestion","Low FODMAP gut friendly","Post-workout ideal","Electrolyte absorption"]},
  {id:33, name:"Basmati Rice",             cat:"Carbohydrate", sub:"Rice",   ref:100, cal:121, p:2.7, c:25,  f:0.4, fi:0.7, benefits:["Lower GI than white rice","Fragrant aromatic texture","Indian & Arabic cuisine staple","Thiamine energy","B vitamins"]},
  {id:34, name:"Jasmine Rice",             cat:"Carbohydrate", sub:"Rice",   ref:100, cal:129, p:2.5, c:28,  f:0.2, fi:0.3, benefits:["Thai aromatic soft texture","Quick cooking convenience","Potassium electrolyte","Easy protein pairing","Gulf & Asian fusion"]},
  {id:35, name:"Wild Rice",                cat:"Carbohydrate", sub:"Rice",   ref:100, cal:101, p:4,   c:21,  f:0.3, fi:1.8, benefits:["Highest protein of all rices","Antioxidant rich","Zinc & magnesium","Lower GI","Nutty gourmet presentation"]},
  {id:36, name:"Black Rice (Forbidden)",   cat:"Carbohydrate", sub:"Rice",   ref:100, cal:101, p:4.5, c:21,  f:0.8, fi:3.5, benefits:["Highest antioxidant rice","Anthocyanin brain health","Anti-inflammatory","Heart health","Iron & vitamin E"]},
  {id:37, name:"Red Rice",                 cat:"Carbohydrate", sub:"Rice",   ref:100, cal:111, p:2.7, c:23,  f:0.8, fi:2.0, benefits:["Anthocyanin antioxidants","Iron rich","Low GI","Middle Eastern use","Gut health fibre"]},
  // CARBS — GRAINS
  {id:38, name:"Quinoa",                   cat:"Carbohydrate", sub:"Grains",  ref:100, cal:120, p:4.4, c:22,  f:1.9, fi:2.8, benefits:["Complete protein all 9 aminos","Gluten-free pseudo-grain","Iron & magnesium","Quercetin anti-inflammatory","Longevity superfood"]},
  {id:39, name:"Oats (quick)",             cat:"Carbohydrate", sub:"Grains",  ref:100, cal:389, p:17,  c:66,  f:7,   fi:10,  benefits:["Beta-glucan cholesterol reduction","4hr sustained energy","Avenanthramides antioxidant","Prebiotic fibre","Ideal pre-training meal base"]},
  {id:40, name:"Steel Cut Oats",           cat:"Carbohydrate", sub:"Grains",  ref:100, cal:375, p:14,  c:67,  f:7,   fi:10,  benefits:["Lowest GI oat variety","Maximum fibre retention","Longest satiety window","Heart health beta-glucan","Meal prep batch cook"]},
  {id:41, name:"Freekeh",                  cat:"Carbohydrate", sub:"Grains",  ref:100, cal:135, p:4.9, c:28,  f:0.5, fi:6,   benefits:["Ancient Middle Eastern grain","Highest fibre grain variety","Prebiotic gut diversity","Iron & calcium","Smoked distinctive flavour"]},
  {id:42, name:"Bulgur Wheat",             cat:"Carbohydrate", sub:"Grains",  ref:100, cal:83,  p:3.1, c:19,  f:0.2, fi:4.5, benefits:["Tabbouleh classic base","Low GI grain","Manganese bone health","B vitamins energy","Quick 5-min cook"]},
  {id:43, name:"Couscous",                 cat:"Carbohydrate", sub:"Grains",  ref:100, cal:112, p:3.8, c:23,  f:0.2, fi:1.4, benefits:["Arabic cuisine tradition","Selenium rich","5-min cooking convenience","Low fat grain","Versatile base"]},
  {id:44, name:"Buckwheat",                cat:"Carbohydrate", sub:"Grains",  ref:100, cal:92,  p:3.4, c:20,  f:0.6, fi:2.7, benefits:["Gluten-free pseudo-grain","Rutin blood vessel health","Blood sugar regulation","Complete amino acids","Magnesium source"]},
  // CARBS — PASTA & BREAD
  {id:45, name:"White Pasta",              cat:"Carbohydrate", sub:"Pasta",   ref:100, cal:158, p:5.8, c:31,  f:0.9, fi:1.8, benefits:["Energy dense pre-event","Easy digestion","B vitamins fortified","Performance carb load","Versatile base"]},
  {id:46, name:"Wholemeal Pasta",          cat:"Carbohydrate", sub:"Pasta",   ref:100, cal:149, p:6.3, c:28,  f:1.1, fi:3.9, benefits:["Higher fibre lower GI","Magnesium rich","Sustained energy","Gut health support","Better satiety"]},
  {id:47, name:"Chickpea Pasta",           cat:"Carbohydrate", sub:"Pasta",   ref:100, cal:181, p:12,  c:27,  f:3.5, fi:5,   benefits:["Highest protein pasta","Folate DNA synthesis","Resistant starch gut","Blood sugar stability","Plant protein combo"]},
  {id:48, name:"Sweet Potato",             cat:"Carbohydrate", sub:"Root Veg",ref:100, cal:86,  p:1.6, c:20,  f:0.1, fi:3,   benefits:["Beta-carotene vitamin A","Low GI sustained energy","Potassium source","Anti-inflammatory","Performance carb for training days"]},
  {id:49, name:"White Potato",             cat:"Carbohydrate", sub:"Root Veg",ref:100, cal:87,  p:2.3, c:20,  f:0.1, fi:1.8, benefits:["Potassium electrolyte","Resistant starch when cooled","Satiety index high","Vitamin C & B6","Glycogen replenishment"]},
  {id:50, name:"Sourdough Bread",          cat:"Carbohydrate", sub:"Bread",   ref:40,  cal:98,  p:3.6, c:19,  f:0.8, fi:1,   benefits:["Fermentation improves gut health","Lower GI than white","Phytic acid reduced","Better mineral absorption","Lactic acid prebiotic"]},
  {id:51, name:"Wholegrain Bread",         cat:"Carbohydrate", sub:"Bread",   ref:38,  cal:95,  p:4.2, c:17,  f:1.5, fi:2.7, benefits:["High fibre satiety","B vitamins complex","Lignans anti-inflammatory","Blood sugar stability","Cholesterol reduction"]},
  {id:52, name:"Pita Bread (wholemeal)",   cat:"Carbohydrate", sub:"Bread",   ref:60,  cal:165, p:6,   c:31,  f:1.4, fi:4.5, benefits:["Middle Eastern tradition","Fibre rich","Low fat","Pocket for variety","Pairs with hummus"]},
  {id:53, name:"Pita Bread (white)",       cat:"Carbohydrate", sub:"Bread",   ref:60,  cal:170, p:5.5, c:35,  f:0.7, fi:1.5, benefits:["Arabic bread tradition","Quick energy source","Low fat option","Dipping bread","Easy digestion"]},
  {id:54, name:"Lavash Flatbread",         cat:"Carbohydrate", sub:"Bread",   ref:50,  cal:145, p:4.5, c:29,  f:1.5, fi:1.2, benefits:["Gulf region thin bread","Low calorie wrap","Iron fortified","Versatile meal base","Traditional culture"]},
  {id:55, name:"Rye Bread",                cat:"Carbohydrate", sub:"Bread",   ref:32,  cal:83,  p:2.7, c:15,  f:1,   fi:1.9, benefits:["Lowest GI bread","Arabinoxylan gut fibre","Blood sugar stability","Satiety superior","Cholesterol support"]},
  {id:56, name:"Burgen Soy-Lin Bread",     cat:"Carbohydrate", sub:"Bread",   ref:38,  cal:91,  p:5.4, c:12,  f:2.6, fi:3,   benefits:["Highest protein bread","Soy isoflavones","Low GI","Omega-3 linseeds","Highest protein bread available"]},
  // VEGETABLES — expanded
  {id:57, name:"Spinach",                  cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:23,  p:2.9, c:3.6, f:0.4, fi:2.2, benefits:["Iron for blood oxygen","Nitrates athletic performance","Lutein & zeaxanthin eyes","Vitamin K bone density","Folate cell health"]},
  {id:58, name:"Kale",                     cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:35,  p:2.9, c:4.4, f:1.5, fi:4.1, benefits:["Vitamin K highest food","Sulforaphane anti-cancer","Calcium exceeds milk","Quercetin inflammation","Detox glucosinolates"]},
  {id:59, name:"Rocket (Arugula)",         cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:25,  p:2.6, c:3.7, f:0.7, fi:1.6, benefits:["Nitric oxide precursor","Performance sport benefit","Glucosinolates detox","Peppery gourmet flavour","Folate source"]},
  {id:60, name:"Cos Lettuce",              cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:17,  p:1.2, c:3.3, f:0.3, fi:2.1, benefits:["Low calorie high volume","Vitamin A beta-carotene","Folate heart health","Hydrating 95% water","Crunch texture"]},
  {id:61, name:"Butter Lettuce",           cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:13,  p:1.4, c:2.2, f:0.2, fi:1.1, benefits:["Extremely low calorie","Soft delicate texture","Folate source","Vitamin K bone","High water content hydrating"]},
  {id:62, name:"Iceberg Lettuce",          cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:14,  p:0.9, c:3.0, f:0.1, fi:1.2, benefits:["Very low calorie","96% water hydration","Vitamin K source","Volume eating tool","Wrap substitute"]},
  {id:63, name:"Swiss Chard (Silverbeet)", cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:19,  p:1.8, c:3.7, f:0.2, fi:1.6, benefits:["Magnesium highest leafy green","Vitamin K bone density","Betalain antioxidants","Iron for blood","Anti-inflammatory"]},
  {id:64, name:"Watercress",               cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:11,  p:2.3, c:1.3, f:0.1, fi:0.5, benefits:["Vitamin K very high","Anti-cancer PEITC","Vitamin C immune","Calcium bone health","Chlorophyll detox"]},
  {id:65, name:"Broccoli",                 cat:"Vegetable", sub:"Brassicas",  ref:100, cal:34,  p:2.8, c:7,   f:0.4, fi:2.6, benefits:["Sulforaphane potent anti-cancer","Vitamin C immune boost","Folate DNA repair","Calcium mineral","Detox enzyme activator"]},
  {id:66, name:"Cauliflower",              cat:"Vegetable", sub:"Brassicas",  ref:100, cal:25,  p:2,   c:5,   f:0.3, fi:2,   benefits:["Low-carb rice substitute","Vitamin C high","Choline brain health","Glucosinolates anti-cancer","Anti-inflammatory"]},
  {id:67, name:"Brussels Sprouts",         cat:"Vegetable", sub:"Brassicas",  ref:100, cal:43,  p:3.4, c:9,   f:0.3, fi:3.8, benefits:["Vitamin K highest brassica","Sulforaphane concentrated","ALA omega-3 source","Immune Vitamin C","Gut microbiome fuel"]},
  {id:68, name:"Bok Choy",                 cat:"Vegetable", sub:"Brassicas",  ref:100, cal:13,  p:1.5, c:2.2, f:0.2, fi:1,   benefits:["Calcium non-dairy source","Cruciferous cancer protection","Vitamin C immune","Beta-carotene skin","Very low calorie"]},
  {id:69, name:"Cherry Tomatoes",          cat:"Vegetable", sub:"Vegetables", ref:100, cal:18,  p:0.9, c:3.9, f:0.2, fi:1.2, benefits:["Lycopene anti-cancer","Vitamin C immune","Very low calorie","Hydrating","Heart protective"]},
  {id:70, name:"Roma Tomato",              cat:"Vegetable", sub:"Vegetables", ref:100, cal:20,  p:0.9, c:4.3, f:0.2, fi:1.5, benefits:["Lycopene prostate & heart","Vitamin C","Potassium electrolyte","Folate source","Meaty texture for cooking"]},
  {id:71, name:"Red Capsicum",             cat:"Vegetable", sub:"Vegetables", ref:100, cal:31,  p:1,   c:6,   f:0.3, fi:2.1, benefits:["Highest Vitamin C vegetable","Beta-carotene antioxidant","Lutein eye protection","Collagen synthesis","Anti-inflammatory"]},
  {id:72, name:"Yellow Capsicum",          cat:"Vegetable", sub:"Vegetables", ref:100, cal:27,  p:1,   c:6.3, f:0.2, fi:0.9, benefits:["Zeaxanthin eye health","Vitamin C source","Low calorie colour","Antioxidant carotenoids","Collagen synthesis"]},
  {id:73, name:"Green Capsicum",           cat:"Vegetable", sub:"Vegetables", ref:100, cal:20,  p:0.9, c:4.6, f:0.2, fi:1.7, benefits:["Vitamin C source","Chlorophyll detox","Low calorie","Lycopene precursor","Versatile cooking"]},
  {id:74, name:"Asparagus",               cat:"Vegetable", sub:"Vegetables", ref:100, cal:20,  p:2.2, c:3.9, f:0.1, fi:2.1, benefits:["Natural diuretic lean physique","Folate prenatal health","Prebiotic inulin gut","Glutathione anti-aging","Post-workout meal essential"]},
  {id:75, name:"Zucchini",                 cat:"Vegetable", sub:"Vegetables", ref:100, cal:17,  p:1.2, c:3.1, f:0.3, fi:1,   benefits:["Extremely low calorie filler","Pasta substitute noodles","Potassium source","Vitamin C & A","Hydrating 95% water"]},
  {id:76, name:"Eggplant (Aubergine)",     cat:"Vegetable", sub:"Vegetables", ref:100, cal:25,  p:1,   c:6,   f:0.2, fi:3,   benefits:["Nasunin brain antioxidant","Middle Eastern essential","Manganese bone health","Fibre gut health","Baba ganoush base"]},
  {id:77, name:"Mushrooms (button)",       cat:"Vegetable", sub:"Vegetables", ref:100, cal:22,  p:3.1, c:3.3, f:0.3, fi:1,   benefits:["Vitamin D if UV-exposed","Beta-glucan immunity","B vitamins energy","Umami flavour depth","Low calorie protein boost"]},
  {id:78, name:"Mushrooms (shiitake)",     cat:"Vegetable", sub:"Vegetables", ref:100, cal:34,  p:2.2, c:6.8, f:0.5, fi:2.5, benefits:["Lentinan immune modulation","Eritadenine cholesterol lowering","Selenium antioxidant","B12 source","Medicinal properties"]},
  {id:79, name:"Mushrooms (portobello)",   cat:"Vegetable", sub:"Vegetables", ref:100, cal:26,  p:2.1, c:5.1, f:0.3, fi:1.3, benefits:["Meaty texture meat substitute","Vitamin D source","Potassium electrolyte","Selenium antioxidant","B vitamins energy"]},
  {id:80, name:"Onion (brown)",            cat:"Vegetable", sub:"Aromatics",  ref:100, cal:40,  p:1.1, c:9.3, f:0.1, fi:1.7, benefits:["Quercetin anti-inflammatory","Allicin antimicrobial","Prebiotic fibre","Blood sugar regulation","Every cuisine base"]},
  {id:81, name:"Red Onion",                cat:"Vegetable", sub:"Aromatics",  ref:100, cal:42,  p:0.9, c:10,  f:0.1, fi:1.7, benefits:["Anthocyanin antioxidant","Quercetin highest onion","Heart health","Anti-inflammatory","Raw salad essential"]},
  {id:82, name:"Spring Onion (Scallion)",  cat:"Vegetable", sub:"Aromatics",  ref:100, cal:32,  p:1.8, c:7.3, f:0.2, fi:2.6, benefits:["Vitamin K bone health","Vitamin C immune","Allicin antimicrobial","Low calorie garnish","Folate source"]},
  {id:83, name:"Garlic",                   cat:"Vegetable", sub:"Aromatics",  ref:3,   cal:4,   p:0.2, c:1,   f:0,   fi:0.1, benefits:["Allicin powerful antimicrobial","Blood pressure reduction","Immune boost potent","Cholesterol lowering","Anti-cancer properties"]},
  {id:84, name:"Ginger (fresh)",           cat:"Vegetable", sub:"Aromatics",  ref:5,   cal:4,   p:0.1, c:0.8, f:0,   fi:0.1, benefits:["Gingerol anti-inflammatory","Post-exercise nausea relief","Digestive enzyme support","Thermogenic metabolism","Pain reduction"]},
  {id:85, name:"Cucumber",                 cat:"Vegetable", sub:"Vegetables", ref:100, cal:16,  p:0.7, c:3.6, f:0.1, fi:0.5, benefits:["97% water hydration","Extremely low calorie","Vitamin K bone","Silica skin health","Cooling anti-inflammatory"]},
  {id:86, name:"Carrot",                   cat:"Vegetable", sub:"Vegetables", ref:100, cal:41,  p:0.9, c:10,  f:0.2, fi:2.8, benefits:["Beta-carotene eye health","Vitamin A skin clarity","Falcarinol anti-cancer","Fibre gut health","Immune vitamin A"]},
  {id:87, name:"Beetroot",                 cat:"Vegetable", sub:"Vegetables", ref:100, cal:43,  p:1.6, c:10,  f:0.2, fi:2.8, benefits:["Nitrates endurance performance","Betalain antioxidant unique","Folate cell repair","Blood pressure reduction","Liver detox"]},
  {id:88, name:"Baby Peas",                cat:"Vegetable", sub:"Vegetables", ref:100, cal:80,  p:5.4, c:14,  f:0.4, fi:5.1, benefits:["Plant protein source","High fibre gut health","Vitamin C immune","Folate cell health","Lutein eye protection"]},
  {id:89, name:"Edamame",                  cat:"Vegetable", sub:"Vegetables", ref:100, cal:121, p:11,  c:8.9, f:5.2, fi:5.2, benefits:["Complete plant protein","All 9 amino acids","Isoflavones hormones","Folate rich","Omega-3 ALA source"]},
  {id:90, name:"Corn (sweet)",             cat:"Vegetable", sub:"Vegetables", ref:100, cal:86,  p:3.2, c:19,  f:1.2, fi:2.7, benefits:["Zeaxanthin eye health","B vitamins thiamine","Ferulic acid antioxidant","Performance fuel","Fibre gut support"]},
  {id:91, name:"Pumpkin",                  cat:"Vegetable", sub:"Vegetables", ref:100, cal:26,  p:1,   c:6.5, f:0.1, fi:0.5, benefits:["Beta-carotene skin health","Low calorie dense","Vitamin A immune","Middle Eastern popular","Seeds zinc rich"]},
  {id:92, name:"Green Beans",              cat:"Vegetable", sub:"Vegetables", ref:100, cal:31,  p:1.8, c:7,   f:0.1, fi:2.7, benefits:["Vitamin K bone health","Folate source","Chlorophyll detox","Silicon skin health","Low calorie"]},
  {id:93, name:"Broccolini",               cat:"Vegetable", sub:"Brassicas",  ref:100, cal:35,  p:3.5, c:4.5, f:0.5, fi:3.4, benefits:["Sulforaphane high","Vitamin C immune","Higher folate than broccoli","Calcium source","Elegant plating"]},
  {id:94, name:"Snow Peas",                cat:"Vegetable", sub:"Vegetables", ref:100, cal:42,  p:2.8, c:7.5, f:0.2, fi:2.5, benefits:["Vitamin C high","Iron source","Folate","Fibre moderate","Crisp texture stir-fry"]},
  {id:95, name:"Baby Spinach",             cat:"Vegetable", sub:"Leafy Greens",ref:100,cal:20,  p:2.5, c:2.8, f:0.4, fi:2,   benefits:["Tender leaves easy eating","Iron for blood oxygen","Nitrate performance","Folate","Versatile raw or cooked"]},
  {id:96, name:"Artichoke (heart)",        cat:"Vegetable", sub:"Vegetables", ref:100, cal:47,  p:3.3, c:10.5,f:0.2, fi:5.4, benefits:["Highest fibre vegetable","Cynarin liver detox","Prebiotic inulin","Folate high","Blood sugar regulation"]},
  {id:97, name:"Fennel",                   cat:"Vegetable", sub:"Vegetables", ref:100, cal:31,  p:1.2, c:7.3, f:0.2, fi:3.1, benefits:["Anethole digestive soothing","Vitamin C & potassium","Bone health calcium","Phytoestrogen moderate","Gourmet Mediterranean flavour"]},
  {id:98, name:"Leek",                     cat:"Vegetable", sub:"Aromatics",  ref:100, cal:61,  p:1.5, c:14,  f:0.3, fi:1.8, benefits:["Prebiotic inulin fibre","Folate source","Kaempferol anti-cancer","Vitamin K","Allicin antimicrobial mild"]},
  // FRUITS — expanded
  {id:99, name:"Blueberries",              cat:"Fruit", sub:"Berries",       ref:100, cal:57,  p:0.7, c:14,  f:0.3, fi:2.4, benefits:["Anthocyanin brain health","Memory & cognitive boost","Blood pressure reduction","ORAC highest berry","Post-exercise recovery"]},
  {id:100,name:"Strawberries",             cat:"Fruit", sub:"Berries",       ref:100, cal:32,  p:0.7, c:7.7, f:0.3, fi:2,   benefits:["Vitamin C highest berry","Ellagic acid anti-cancer","Blood sugar regulation","Collagen synthesis","Anti-inflammatory"]},
  {id:101,name:"Raspberries",              cat:"Fruit", sub:"Berries",       ref:100, cal:52,  p:1.2, c:11.9,f:0.7, fi:6.5, benefits:["Highest fibre berry","Ellagic acid anti-cancer","Ketones metabolism support","Vitamin C immune","Anti-inflammatory anthocyanin"]},
  {id:102,name:"Blackberries",             cat:"Fruit", sub:"Berries",       ref:100, cal:43,  p:1.4, c:9.6, f:0.5, fi:5.3, benefits:["Anthocyanin antioxidant","Vitamin K highest berry","Manganese energy","High fibre gut","Brain protective"]},
  {id:103,name:"Açaí (frozen pulp)",       cat:"Fruit", sub:"Berries",       ref:100, cal:70,  p:1.5, c:4,   f:5,   fi:2,   benefits:["Anthocyanin highest ORAC","Omega-3 & omega-6 balance","Heart health","Anti-aging potent","Brain cognitive function"]},
  {id:104,name:"Goji Berries (dried)",     cat:"Fruit", sub:"Berries",       ref:30,  cal:98,  p:4,   c:20,  f:0.1, fi:3.6, benefits:["Zeaxanthin eye protection","Complete protein berry","Immune polysaccharides","Anti-aging longevity tradition","Iron source"]},
  {id:105,name:"Banana",                   cat:"Fruit", sub:"Fruits",        ref:120, cal:107, p:1.3, c:27,  f:0.4, fi:3.1, benefits:["Potassium for muscle","Quick workout energy","B6 protein metabolism","Resistant starch gut","Post-workout recovery"]},
  {id:106,name:"Apple",                    cat:"Fruit", sub:"Fruits",        ref:182, cal:95,  p:0.5, c:25,  f:0.3, fi:4.4, benefits:["Quercetin anti-inflammatory","Pectin fibre prebiotic","Blood sugar management","Gut microbiome support","Vitamin C immune"]},
  {id:107,name:"Pear",                     cat:"Fruit", sub:"Fruits",        ref:178, cal:101, p:0.6, c:27,  f:0.2, fi:5.5, benefits:["Highest fibre common fruit","Pectin cholesterol lowering","Vitamin C & K","Copper antioxidant","Digestive gentle"]},
  {id:108,name:"Mango",                    cat:"Fruit", sub:"Fruits",        ref:100, cal:60,  p:0.8, c:15,  f:0.4, fi:1.6, benefits:["Vitamin C immune potent","Mangiferin unique antioxidant","Folate DNA synthesis","Vitamin A vision","Digestive amylase enzymes"]},
  {id:109,name:"Pineapple",                cat:"Fruit", sub:"Fruits",        ref:100, cal:50,  p:0.5, c:13,  f:0.1, fi:1.4, benefits:["Bromelain anti-inflammatory","Digestive enzyme potent","Vitamin C immune","Manganese energy","Post-workout inflammation reduction"]},
  {id:110,name:"Papaya",                   cat:"Fruit", sub:"Fruits",        ref:100, cal:43,  p:0.5, c:11,  f:0.3, fi:1.7, benefits:["Papain digestive enzyme","Beta-carotene antioxidant","Vitamin C immune","Folate","Anti-inflammatory lycopene"]},
  {id:111,name:"Kiwi Fruit",               cat:"Fruit", sub:"Fruits",        ref:75,  cal:46,  p:0.9, c:11,  f:0.4, fi:2.1, benefits:["Vitamin C twice orange","Actinidin digestive enzyme","Vitamin K bone","Serotonin sleep quality","Folate source"]},
  {id:112,name:"Dates (Medjool)",          cat:"Fruit", sub:"Fruits",        ref:24,  cal:67,  p:0.4, c:18,  f:0.1, fi:1.6, benefits:["Natural pre-workout energy","Potassium electrolyte","Fibre gut health","Gulf tradition Ramadan","Natural sugar no refining"]},
  {id:113,name:"Pomegranate",              cat:"Fruit", sub:"Fruits",        ref:100, cal:83,  p:1.7, c:19,  f:1.2, fi:4,   benefits:["Punicalagins most potent antioxidant","Anti-inflammatory potent","Blood pressure reduction","Prostate health studies","Middle Eastern superfood"]},
  {id:114,name:"Lemon",                    cat:"Fruit", sub:"Citrus",        ref:50,  cal:12,  p:0.2, c:3.7, f:0.1, fi:0.3, benefits:["Vitamin C immune boost","Alkalising pH effect","Digestion enzyme trigger","Flavour without calories","Detox citric acid"]},
  {id:115,name:"Lime",                     cat:"Fruit", sub:"Citrus",        ref:44,  cal:11,  p:0.2, c:3.7, f:0.1, fi:1.1, benefits:["Vitamin C source","Limonene anti-cancer","Iron absorption enhancer","Arabic cuisine essential","Digestive bitter tonic"]},
  {id:116,name:"Orange",                   cat:"Fruit", sub:"Citrus",        ref:130, cal:62,  p:1.2, c:15.4,f:0.2, fi:3.1, benefits:["Vitamin C very high","Flavonoids heart health","Potassium electrolyte","Folate source","Hesperidin anti-inflammatory"]},
  {id:117,name:"Grapefruit",               cat:"Fruit", sub:"Citrus",        ref:123, cal:52,  p:1,   c:13,  f:0.2, fi:2,   benefits:["Naringenin fat burning","Vitamin C immune","Blood sugar reduction","Lycopene heart","Low calorie citrus"]},
  // FATS & OILS
  {id:118,name:"Avocado",                  cat:"Fat", sub:"Healthy Fats",    ref:75,  cal:120, p:1.5, c:6.4, f:11,  fi:5,   benefits:["Monounsaturated heart fats","Vitamin E antioxidant","Potassium exceeds banana","Folate heart health","Hormone synthesis support"]},
  {id:119,name:"Olive Oil (EVOO)",         cat:"Fat", sub:"Oils",            ref:15,  cal:119, p:0,   c:0,   f:14,  fi:0,   benefits:["Oleocanthal anti-inflammatory","Polyphenol antioxidants","Oleic acid heart","Mediterranean longevity","Vitamin absorption"]},
  {id:120,name:"Coconut Oil",              cat:"Fat", sub:"Oils",            ref:14,  cal:117, p:0,   c:0,   f:13.5,fi:0,   benefits:["MCT brain fuel ketones","Lauric acid antimicrobial","High smoke point stable","Thyroid metabolism","Cooking staple"]},
  {id:121,name:"Sesame Oil",               cat:"Fat", sub:"Oils",            ref:14,  cal:120, p:0,   c:0,   f:14,  fi:0,   benefits:["Sesamin anti-inflammatory","Vitamin E antioxidant","Middle Eastern tahini base","Blood pressure reduction","Sesamol potent"]},
  {id:122,name:"Almonds",                  cat:"Fat", sub:"Nuts & Seeds",    ref:30,  cal:173, p:6,   c:6,   f:15,  fi:3.5, benefits:["Vitamin E highest nut","Magnesium sleep quality","Monounsaturated fats","Calcium bone health","Blood sugar regulation"]},
  {id:123,name:"Walnuts",                  cat:"Fat", sub:"Nuts & Seeds",    ref:30,  cal:196, p:4.6, c:4.1, f:19,  fi:2,   benefits:["ALA omega-3 highest nut","Brain polyphenols BDNF","Neuroprotective compounds","Anti-inflammatory potent","Hormone regulation"]},
  {id:124,name:"Pumpkin Seeds",            cat:"Fat", sub:"Nuts & Seeds",    ref:30,  cal:170, p:8.5, c:4.5, f:14,  fi:1.8, benefits:["Zinc testosterone support","Magnesium sleep quality","Tryptophan serotonin precursor","Prostate health","Iron source"]},
  {id:125,name:"Chia Seeds",               cat:"Fat", sub:"Nuts & Seeds",    ref:20,  cal:97,  p:3.3, c:8.7, f:6.2, fi:6.9, benefits:["ALA omega-3 highest seed","Hydrogel fibre gut motility","Complete amino acids","Calcium dairy-free","Blood sugar stability"]},
  {id:126,name:"Tahini",                   cat:"Fat", sub:"Condiments",      ref:15,  cal:89,  p:2.6, c:3.2, f:8,   fi:0.7, benefits:["Middle Eastern essential","Sesamin anti-inflammatory","Calcium bone health","Methionine amino acid","Zinc immunity boost"]},
  {id:127,name:"Natural Peanut Butter",    cat:"Fat", sub:"Nuts & Seeds",    ref:32,  cal:190, p:8,   c:6,   f:16,  fi:2,   benefits:["Monounsaturated fats","Resveratrol antioxidant","Niacin energy","Arginine circulation","Satiety high-calorie snack"]},
  {id:128,name:"Dark Chocolate (85%)",     cat:"Fat", sub:"Specialty",       ref:30,  cal:165, p:2.5, c:10,  f:14,  fi:3.5, benefits:["Flavanol heart health proven","Magnesium source","Endorphin mood lift","Iron source","Antioxidant ORAC very high"]},
  // SPICES
  {id:129,name:"Turmeric",                 cat:"Spice", sub:"Anti-Inflammatory",ref:3, cal:9,  p:0.3, c:1.9, f:0.3, fi:0.5, benefits:["Curcumin potent anti-inflammatory","Joint pain reduction","Brain BDNF neurogenesis","Liver detox support","Antioxidant ORAC high"]},
  {id:130,name:"Cumin",                    cat:"Spice", sub:"Middle Eastern",  ref:3,  cal:8,  p:0.4, c:0.9, f:0.5, fi:0.2, benefits:["Iron highest spice source","Thymol digestion aid","Blood sugar regulation","Antimicrobial","Gulf cuisine essential"]},
  {id:131,name:"Coriander (ground)",       cat:"Spice", sub:"Middle Eastern",  ref:3,  cal:8,  p:0.3, c:1.2, f:0.4, fi:0.8, benefits:["Blood glucose lowering","Digestive antispasmodic","Iron & manganese","Anti-anxiety linalool","Arabic cooking essential"]},
  {id:132,name:"Cardamom",                 cat:"Spice", sub:"Middle Eastern",  ref:2,  cal:6,  p:0.2, c:1.4, f:0.1, fi:0.6, benefits:["Digestive comfort spice","Anti-nausea properties","Blood pressure reduction","Gulf coffee & tea tradition","Antimicrobial breath"]},
  {id:133,name:"Cinnamon",                 cat:"Spice", sub:"Anti-Inflammatory",ref:3, cal:8,  p:0.1, c:2.1, f:0.1, fi:1.4, benefits:["Insulin sensitivity improvement","Blood sugar regulation","ORAC high antioxidant","Anti-inflammatory","Breakfast oat essential spice"]},
  {id:134,name:"Paprika (smoked)",         cat:"Spice", sub:"Cooking",         ref:3,  cal:8,  p:0.4, c:1.5, f:0.4, fi:0.7, benefits:["Capsaicin anti-inflammatory","Vitamin A beta-carotene","Metabolism thermogenic","Iron source","Colour without calories"]},
  {id:135,name:"Chilli Powder",            cat:"Spice", sub:"Cooking",         ref:3,  cal:8,  p:0.3, c:1.4, f:0.4, fi:0.7, benefits:["Capsaicin thermogenic 4–5%","Vitamin C source","Pain relief compound","Anti-inflammatory","Appetite regulation"]},
  {id:136,name:"Black Pepper",             cat:"Spice", sub:"Cooking",         ref:3,  cal:8,  p:0.3, c:2,   f:0.1, fi:0.8, benefits:["Piperine curcumin absorb 2000%","Digestive HCl stimulation","Antioxidant chromium","Antimicrobial","Bioavailability enhancer"]},
  {id:137,name:"Za'atar",                  cat:"Spice", sub:"Middle Eastern",  ref:8,  cal:22, p:0.7, c:3.6, f:0.8, fi:1.4, benefits:["Thymol antibacterial potent","Carvacrol antifungal","Brain memory support","Calcium & iron","Middle Eastern tradition"]},
  {id:138,name:"Baharat",                  cat:"Spice", sub:"Middle Eastern",  ref:3,  cal:10, p:0.4, c:2,   f:0.4, fi:0.7, benefits:["Multi-spice antioxidant blend","Gulf meat essential spice","Digestive warming complex","Anti-inflammatory","Depth of flavour"]},
  {id:139,name:"Sumac",                    cat:"Spice", sub:"Middle Eastern",  ref:3,  cal:9,  p:0.3, c:2,   f:0.2, fi:0.5, benefits:["Gallic acid antioxidant","Blood sugar control","Anti-inflammatory","Lemon substitute zero calories","Fattoush essential"]},
  {id:140,name:"Harissa Paste",            cat:"Spice", sub:"Middle Eastern",  ref:15, cal:20, p:0.5, c:3,   f:0.8, fi:1,   benefits:["Capsaicin thermogenic","North African cuisine base","Anti-inflammatory chilli","Flavour without many calories","Versatile heat"]},
  {id:141,name:"Garam Masala",             cat:"Spice", sub:"Indian",          ref:3,  cal:10, p:0.4, c:2,   f:0.4, fi:0.6, benefits:["Multi-spice antioxidant","Digestive warming","Indian cuisine foundation","Anti-inflammatory","Metabolism support"]},
  {id:142,name:"Curry Powder",             cat:"Spice", sub:"Indian",          ref:3,  cal:10, p:0.4, c:1.7, f:0.4, fi:0.7, benefits:["Turmeric curcumin base","Multi-mineral source","Anti-cancer potential","Digestive support","Appetite-enhancing aroma"]},
  {id:143,name:"Saffron",                  cat:"Spice", sub:"Middle Eastern",  ref:0.2,cal:1,  p:0,   c:0.2, f:0,   fi:0,   benefits:["Crocin antioxidant premium","Anti-depressant clinical studies","Safranal anti-cancer","Memory & cognitive support","Gulf luxury tradition"]},
  // HERBS
  {id:144,name:"Fresh Parsley",            cat:"Herb", sub:"Fresh Herbs",     ref:10,  cal:4,  p:0.3, c:0.7, f:0.1, fi:0.3, benefits:["Vitamin K highest herb","Apigenin anti-cancer","Folate cardiovascular","Chlorophyll breath freshening","Kidney cleanse diuretic"]},
  {id:145,name:"Fresh Coriander",          cat:"Herb", sub:"Fresh Herbs",     ref:10,  cal:2,  p:0.2, c:0.4, f:0.1, fi:0.3, benefits:["Heavy metal chelation detox","Antimicrobial properties","Digestive carminative","Vitamin K source","Arabic & Indian essential"]},
  {id:146,name:"Fresh Mint",               cat:"Herb", sub:"Fresh Herbs",     ref:10,  cal:7,  p:0.4, c:1.5, f:0.1, fi:1,   benefits:["Menthol IBS relief","Anti-nausea properties","Breath freshening","Arabic tea tradition","Fatigue reduction"]},
  {id:147,name:"Fresh Basil",              cat:"Herb", sub:"Fresh Herbs",     ref:10,  cal:3,  p:0.3, c:0.5, f:0.1, fi:0.4, benefits:["Eugenol anti-inflammatory","Antibacterial linalool","Vitamin K source","Adaptogenic stress reduction","Gourmet finishing herb"]},
  // LEGUMES & CONDIMENTS
  {id:148,name:"Chickpeas (cooked)",       cat:"Carbohydrate", sub:"Legumes", ref:100, cal:164,p:8.9, c:27,  f:2.6, fi:7.6, benefits:["Plant protein source","Resistant starch gut health","Folate high","Iron & zinc","Middle Eastern hummus base"]},
  {id:149,name:"Lentils (red, cooked)",    cat:"Carbohydrate", sub:"Legumes", ref:100, cal:116,p:9,   c:20,  f:0.4, fi:8,   benefits:["Arabic lentil soup base","Fast-cooking convenience","Iron & folate","Digestive friendly","Plant protein soup staple"]},
  {id:150,name:"Hummus",                   cat:"Fat", sub:"Condiments",       ref:30,  cal:70, p:2,   c:6,   f:4.5, fi:1.5, benefits:["Tahini & chickpea synergy","Middle Eastern tradition","Prebiotic fibre gut","Monounsaturated healthy fats","Plant protein source"]},
  {id:151,name:"Apple Cider Vinegar",      cat:"Other", sub:"Condiments",     ref:15,  cal:3,  p:0,   c:0.9, f:0,   fi:0,   benefits:["Acetic acid metabolism boost","Blood sugar reduction","Digestive enzyme trigger","Appetite suppression","Iron absorption enhancer"]},
  {id:152,name:"Tomato Passata",           cat:"Other", sub:"Sauces",         ref:100, cal:25, p:1.7, c:4.8, f:0.2, fi:1.5, benefits:["Lycopene concentrated cooking","Heart protective","Low calorie sauce base","Vitamin C","Versatile base all cuisines"]},
  {id:153,name:"Coconut Milk (lite)",      cat:"Other", sub:"Dairy Alt",      ref:100, cal:52, p:0.6, c:2.1, f:4.5, fi:0,   benefits:["MCT medium chain fats","Lauric acid antimicrobial","Dairy-free creamy texture","Indian & Arabic curry essential","Digestive friendly"]},
  {id:154,name:"Bone Broth",               cat:"Other", sub:"Specialty",      ref:240, cal:38, p:9,   c:0,   f:0.5, fi:0,   benefits:["Collagen peptides joint support","Glycine sleep quality","Gut lining repair & seal","Joint inflammation reduction","Electrolyte mineral rich"]},
];

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
        ? <img src={recipe.photo_url} alt={recipe.name} style={{width:"100%",height:120,objectFit:"cover",display:"block"}}/>
        : <div style={{height:72,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-background-secondary)",fontSize:32}}>{recipe.emoji}</div>
      }
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          {hasPhoto && <span style={{fontSize:16,marginRight:6}}>{recipe.emoji}</span>}
          <span style={{fontSize:10,color:"var(--color-text-tertiary)",padding:"2px 8px",background:"var(--color-background-secondary)",borderRadius:20,marginLeft:"auto"}}>{recipe.cat}</span>
        </div>
        <div style={{fontSize:13,fontWeight:500,lineHeight:1.3,marginBottom:4}}>{recipe.name}</div>
        <div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.5,marginBottom:10}}>{recipe.desc.slice(0,72)}…</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>{parseArr(recipe.tags).slice(0,2).map(tag=><Pill key={tag} text={tag} color={tk.teal} bg={tk.tealSurf}/>)}</div>
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
function RecipeDetail({recipe,onClose,onDelete}) {
  if(!recipe) return null;
  const ings   = parseArr(recipe.ings);
  const tags   = parseArr(recipe.tags);
  const method = parseArr(recipe.method);
  const goal   = parseArr(recipe.goal);
  const safeRecipe = {...recipe, ings, tags, method, goal};
  const m=recipeTotals(safeRecipe);
  const resolved=ings.map(ri=>{const ing=BASE_ING.find(i=>i.id===ri.id);if(!ing)return null;return {...ing,amt:ri.amt,mx:ingMacros(ri)};}).filter(Boolean);
  const hasPhoto=!!recipe.photo_url;

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
    const methodHtml = method.map((step,i)=>
      `<div style="display:flex;gap:10px;margin-bottom:10px;font-size:12px;align-items:flex-start">
        <span style="min-width:22px;height:22px;border-radius:50%;background:#FDEEE6;color:#7A2B07;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0">${i+1}</span>
        <span style="color:#444;line-height:1.6">${step}</span>
      </div>`
    ).join('');
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
      ${hasPhoto?`<img src="${recipe.photo_url}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:20px;display:block"/>`:
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
      {hasPhoto && <img src={recipe.photo_url} alt={recipe.name} style={{width:"100%",height:240,objectFit:"cover",display:"block"}}/>}
      <div style={{padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            {!hasPhoto && <span style={{fontSize:32}}>{recipe.emoji}</span>}
            <h2 style={{fontSize:18,fontWeight:500,margin:hasPhoto?"0 0 2px":"8px 0 2px"}}>{recipe.name}</h2>
            <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{recipe.cat} · {recipe.prep} min prep · {recipe.cook} min cook · serves {recipe.serves}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={handlePrint} style={{padding:"6px 12px",borderRadius:tk.r,cursor:"pointer",fontSize:12,background:tk.tealSurf,color:tk.tealText,border:`1px solid rgba(232,98,26,0.22)`}}>🖨 Print</button>
            {onDelete&&<button onClick={()=>onDelete(recipe.id)} style={{padding:"6px 12px",borderRadius:tk.r,cursor:"pointer",fontSize:12,color:tk.red}}>Delete</button>}
            <button onClick={onClose} style={{padding:"6px 14px",borderRadius:tk.r,cursor:"pointer",fontSize:12}}>Close ✕</button>
          </div>
        </div>
        <p style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.6,marginBottom:16}}>{recipe.desc}</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{tags.map(tag=><Pill key={tag} text={tag} color={tk.teal} bg={tk.tealSurf}/>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",background:"var(--color-background-secondary)",borderRadius:tk.rLg,padding:"16px 12px",marginBottom:24}}>
          {[["Calories",m.cal,""],["Protein",m.p,"g"],["Carbs",m.c,"g"],["Fat",m.f,"g"],["Fibre",m.fi,"g"]].map(([l,v,u])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:500}}>{v}{u}</div><div style={{fontSize:10,color:"var(--color-text-secondary)",marginTop:3}}>{l}</div></div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          <div>
            <h3 style={{fontSize:13,fontWeight:500,marginBottom:12}}>Ingredients</h3>
            {resolved.map((ing,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:tk.bd,fontSize:12}}>
                <div><span style={{fontWeight:500}}>{ing.name}</span><span style={{color:"var(--color-text-tertiary)",marginLeft:6}}>{ing.amt}g</span></div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{Math.round(ing.mx.cal)} kcal · <span style={{color:tk.blue}}>{Math.round(ing.mx.p)}P</span></div>
              </div>
            ))}
            <h3 style={{fontSize:13,fontWeight:500,margin:"20px 0 12px"}}>Method</h3>
            {method.map((step,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:10,fontSize:12}}>
                <span style={{width:20,height:20,borderRadius:"50%",background:tk.tealSurf,color:tk.tealText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,flexShrink:0}}>{i+1}</span>
                <span style={{color:"var(--color-text-secondary)",lineHeight:1.6}}>{step}</span>
              </div>
            ))}
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

          <button onClick={save} disabled={uploading} style={{width:"100%",padding:"13px",background:saved?tk.green:tk.teal,color:"white",borderRadius:tk.rLg,cursor:uploading?"wait":"pointer",fontSize:14,fontWeight:600,border:"none",transition:"background 0.2s",opacity:uploading?0.75:1}}>
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
  return {...r, ings:parseArr(r.ings), tags:parseArr(r.tags), method:parseArr(r.method), goal:parseArr(r.goal)};
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
  const [showUploader,setShowUploader] = useState(false);
  const [recCat,setRecCat]    = useState("All");
  const [recGoal,setRecGoal]  = useState("all");
  const [recSearch,setRecSearch] = useState("");
  const [ingSearch,setIngSearch] = useState("");
  const [ingCat,setIngCat]    = useState("All");
  const [ingSub,setIngSub]    = useState("All");
  const [ingredients,setIngredients] = useState(BASE_ING);
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

  useEffect(()=>{setMacros(calcMacros(profile));},[profile]);
  useEffect(()=>{ setClientDraft(selClient ? {...selClient} : null); },[selClient?.id]);

  useEffect(()=>{
    async function loadDb() {
      try {
        const [{data:ings,error:ie},{data:recs,error:re},{data:cls,error:ce}] = await Promise.all([
          supabase.from('ingredients').select('*').order('id'),
          supabase.from('recipes').select('*').order('id'),
          supabase.from('clients').select('*').order('id'),
        ]);
        if(!ie && ings?.length) setIngredients(ings);
        if(!re && recs?.length) setRecipes(recs.map(normalizeRecipe));
        if(!ce && cls?.length) setClients(cls.map(c=>({...c,activityLevel:c.activity_level})));
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
  async function saveClient() {
    if(!clientDraft) return;
    const updated={...clientDraft};
    setClients(prev=>prev.map(c=>c.id===updated.id?updated:c));
    setSelClient(updated);
    try {
      await supabase.from('clients').upsert({
        id:updated.id, name:updated.name, age:updated.age, weight:updated.weight,
        height:updated.height, gender:updated.gender, goal:updated.goal,
        activity_level:updated.activityLevel,
      },{onConflict:'id'});
    } catch(e){}
  }

  const filteredRecipes = useMemo(()=>recipes.filter(r=>{
    const mc=recCat==="All"||r.cat===recCat;
    const mg=recGoal==="all"||parseArr(r.goal).includes(recGoal);
    const mt=!recSearch||r.name.toLowerCase().includes(recSearch.toLowerCase());
    return mc&&mg&&mt;
  }),[recipes,recCat,recGoal,recSearch]);

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

  const TABS=[
    {id:"dashboard",   label:"Dashboard",   icon:"📊"},
    {id:"calculator",  label:"Calculator",  icon:"🧮"},
    {id:"recipes",     label:"Recipes",     icon:"🍽️"},
    {id:"builder",     label:"Meal builder",icon:"🔧"},
    {id:"ingredients", label:"Ingredients", icon:"🌿"},
    {id:"clients",     label:"Clients",     icon:"👥"},
    {id:"workouts",    label:"Workouts",    icon:"🏋️"},
  ];

  const Nav = (
    <div style={{background:"var(--color-background-primary)",borderBottom:tk.bd,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/logo.png" alt="Burnt Calories" style={{height:32,display:"block"}}/>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:14,fontWeight:600,letterSpacing:"-0.02em",color:"var(--color-text-primary)"}}>
                <span style={{color:"#E8621A"}}>Burnt</span> Calories
              </span>
              <span style={{fontSize:10,color:"var(--color-text-tertiary)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Nutrition & Performance</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Hi, {profile.name}</span>
            {macros&&<Pill text={macros.targetCal+" kcal"} color={tk.tealText} bg={tk.tealSurf}/>}
          </div>
        </div>
        <div style={{display:"flex",overflowX:"auto"}}>
          {TABS.map(tb=>(
            <button key={tb.id} onClick={()=>{setTab(tb.id);setSelRecipe(null);setShowUploader(false);}}
              style={{padding:"8px 14px",fontSize:12,whiteSpace:"nowrap",borderRadius:0,background:"transparent",color:tab===tb.id?"var(--color-text-primary)":"var(--color-text-secondary)",fontWeight:tab===tb.id?500:400,borderBottom:tab===tb.id?`2px solid ${tk.teal}`:"2px solid transparent",cursor:"pointer"}}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const wrap=ch=><div style={{maxWidth:1200,margin:"0 auto",padding:"28px 20px"}}>{ch}</div>;

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
            <span style={{fontSize:13,fontWeight:500,color:tk.tealText}}>👁 Viewing: {viewingClient.name}</span>
            <button onClick={()=>setSelClient(null)} style={{fontSize:12,color:tk.tealText,cursor:"pointer",border:"none",background:"transparent",fontWeight:500}}>← Back to my dashboard</button>
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
  if(tab==="calculator") return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(
        <div style={{maxWidth:640}}>
          <Hdr title="Macro calculator" sub="Harris-Benedict BMR · activity-adjusted TDEE · your personalised Burnt Calories targets"/>
          <div style={{...crd,marginBottom:16}}>
            <h2 style={{fontSize:13,fontWeight:500,margin:"0 0 16px"}}>Personal details</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[{k:"name",l:"Full name",type:"text",ph:"Your name"},{k:"age",l:"Age",type:"number",ph:"35"},{k:"weight",l:"Weight (kg)",type:"number",ph:"80"},{k:"height",l:"Height (cm)",type:"number",ph:"178"}].map(f=>(
                <div key={f.k}><label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:5}}>{f.l}</label><input type={f.type} value={profile[f.k]||""} onChange={e=>setProfile(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",boxSizing:"border-box"}}/></div>
              ))}
            </div>
            <div style={{marginTop:14}}>
              <label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:8}}>Biological sex</label>
              <div style={{display:"flex",gap:8}}>
                {["male","female"].map(g=>(
                  <button key={g} onClick={()=>setProfile(p=>({...p,gender:g}))} style={{flex:1,padding:10,borderRadius:tk.r,background:profile.gender===g?tk.teal:"transparent",color:profile.gender===g?"white":"var(--color-text-primary)",cursor:"pointer",fontSize:13,fontWeight:profile.gender===g?500:400,border:profile.gender===g?`1px solid ${tk.teal}`:tk.bdMed}}>
                    {g==="male"?"♂ Male":"♀ Female"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{...crd,marginBottom:16}}>
            <h2 style={{fontSize:13,fontWeight:500,margin:"0 0 14px"}}>Primary goal</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {GOALS.map(g=>(
                <button key={g.id} onClick={()=>setProfile(p=>({...p,goal:g.id}))} style={{padding:14,borderRadius:tk.r,border:profile.goal===g.id?`2px solid ${g.color}`:tk.bd,background:profile.goal===g.id?g.color+"12":"transparent",cursor:"pointer",textAlign:"left"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{g.icon}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{g.label}</div>
                  <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>{g.adj>0?"+":""}{g.adj} kcal vs TDEE</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{...crd,marginBottom:16}}>
            <h2 style={{fontSize:13,fontWeight:500,margin:"0 0 14px"}}>Activity level</h2>
            {ACTIVITY.map(a=>(
              <button key={a.id} onClick={()=>setProfile(p=>({...p,activityLevel:a.id}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"11px 14px",borderRadius:tk.r,border:profile.activityLevel===a.id?`2px solid ${tk.teal}`:tk.bd,background:profile.activityLevel===a.id?tk.tealSurf:"transparent",cursor:"pointer",marginBottom:6,textAlign:"left"}}>
                <div><div style={{fontSize:13,fontWeight:profile.activityLevel===a.id?500:400,color:profile.activityLevel===a.id?tk.tealText:"var(--color-text-primary)"}}>{a.label}</div><div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{a.desc}</div></div>
                <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>×{a.mult}</span>
              </button>
            ))}
          </div>
          {macros&&(
            <div style={{...crd,border:`2px solid ${tk.teal}`}}>
              <h2 style={{fontSize:13,fontWeight:500,margin:"0 0 16px"}}>Your results</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
                {[["BMR",macros.bmr,"kcal/day"],["TDEE",macros.tdee,"kcal/day"],["Daily target",macros.targetCal,"kcal/day"]].map(([l,v,d])=>(
                  <div key={l} style={{textAlign:"center",background:"var(--color-background-secondary)",borderRadius:tk.r,padding:"12px 8px"}}>
                    <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>{l}</div>
                    <div style={{fontSize:22,fontWeight:500,color:tk.teal}}>{v}</div>
                    <div style={{fontSize:9,color:"var(--color-text-tertiary)",marginTop:2}}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {[["Protein",macros.proteinG+"g",tk.blue],["Carbs",macros.carbG+"g",tk.green],["Fat",macros.fatG+"g",tk.coral]].map(([l,v,c])=>(
                  <div key={l} style={{borderLeft:`3px solid ${c}`,paddingLeft:12}}>
                    <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{l}</div>
                    <div style={{fontSize:20,fontWeight:500,color:c,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── RECIPES ──────────────────────────────────────────────────────────────────
  if(tab==="recipes") return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <Hdr title="Recipe library" sub={`${recipes.length} recipes · ${recipes.filter(r=>r.custom).length} custom · full macro breakdown · Burnt Calories`}/>
          <button onClick={()=>{setShowUploader(u=>!u);setSelRecipe(null);}} style={{padding:"9px 18px",background:showUploader?"var(--color-background-secondary)":tk.teal,color:showUploader?"var(--color-text-primary)":"white",borderRadius:tk.rLg,cursor:"pointer",fontSize:13,fontWeight:500,border:showUploader?tk.bd:"none",whiteSpace:"nowrap"}}>
            {showUploader?"Cancel":"+ Add recipe"}
          </button>
        </div>
        {showUploader&&<RecipeUploader ingredients={ingredients} onSave={r=>{addRecipe(r);setShowUploader(false);}} onClose={()=>setShowUploader(false)}/>}
        {!showUploader&&<>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <input value={recSearch} onChange={e=>setRecSearch(e.target.value)} placeholder="Search recipes…" style={{flex:1,minWidth:180}}/>
            <select value={recCat} onChange={e=>setRecCat(e.target.value)} style={{minWidth:130}}>
              {["All","Breakfast","Lunch","Dinner","Snack"].map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={recGoal} onChange={e=>setRecGoal(e.target.value)} style={{minWidth:150}}>
              <option value="all">All goals</option>
              {GOALS.map(g=><option key={g.id} value={g.id}>{g.icon} {g.label}</option>)}
            </select>
          </div>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:14}}>{filteredRecipes.length} recipes</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
            {filteredRecipes.map(r=><RecipeCard key={r.id} recipe={r} selected={selRecipe?.id===r.id} onSelect={r=>setSelRecipe(selRecipe?.id===r.id?null:r)}/>)}
          </div>
          {selRecipe&&<RecipeDetail recipe={selRecipe} onClose={()=>setSelRecipe(null)} onDelete={selRecipe.custom?deleteRecipe:null}/>}
        </>}
      </>)}
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
        <div style={{...crd,padding:0,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.55fr 0.65fr 0.55fr 0.55fr 0.55fr 2.8fr",gap:12,padding:"10px 16px",background:"var(--color-background-secondary)",fontSize:9,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>
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
  if(tab==="clients") return (
    <div style={{minHeight:"100vh",background:"var(--color-background-tertiary)"}}>
      {Nav}{wrap(
        <div style={{display:"grid",gridTemplateColumns:selClient?"260px 1fr":"1fr",gap:20,alignItems:"start"}}>
          <div>
            <Hdr title="Clients" sub={`${clients.length} active clients`}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {clients.map(c=>{
                const cm=calcMacros({...c,age:String(c.age),weight:String(c.weight),height:String(c.height)});
                const g=GOALS.find(x=>x.id===c.goal);
                return (
                  <div key={c.id} onClick={()=>setSelClient(selClient?.id===c.id?null:c)} style={{...crd,cursor:"pointer",border:selClient?.id===c.id?`2px solid ${tk.teal}`:tk.bd}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}><span style={{fontSize:13,fontWeight:500}}>{c.name}</span><Pill text={`${g?.icon} ${g?.label}`} color={g?.color}/></div>
                    <div style={{fontSize:10,color:"var(--color-text-secondary)",marginBottom:3}}>{c.age}y · {c.weight}kg · {c.height}cm</div>
                    {cm&&<div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{cm.targetCal} kcal · {cm.proteinG}g P · {cm.carbG}g C · {cm.fatG}g F</div>}
                  </div>
                );
              })}
              <button onClick={()=>{const nc={id:Date.now(),name:"New client",age:30,weight:75,height:175,gender:"male",goal:"fat_loss",activityLevel:"moderate"};setClients(cs=>[...cs,nc]);setSelClient(nc);}} style={{padding:12,border:"0.5px dashed var(--color-border-secondary)",borderRadius:tk.rLg,cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)",background:"transparent"}}>+ Add new client</button>
            </div>
          </div>
          {selClient&&clientDraft&&(()=>{
            const cm=calcMacros({...clientDraft,age:String(clientDraft.age),weight:String(clientDraft.weight),height:String(clientDraft.height)});
            const inp2={width:"100%",boxSizing:"border-box",padding:"9px 12px",border:"1px solid #cccccc",borderRadius:tk.r,fontSize:13,background:"var(--color-background-primary)",color:"var(--color-text-primary)"};
            const lbl2={fontSize:12,color:"#4A4A4A",display:"block",marginBottom:5,fontWeight:500};
            return (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={crd}>
                  {/* Header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div>
                      <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 4px",color:"var(--color-text-primary)"}}>{clientDraft.name}</h2>
                      {cm&&<Pill text={`${cm.targetCal} kcal/day`} color={tk.tealText} bg={tk.tealSurf}/>}
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <button onClick={()=>setTab("dashboard")} style={{fontSize:12,padding:"7px 14px",borderRadius:tk.r,cursor:"pointer",border:tk.bdMed,background:"transparent",color:"var(--color-text-secondary)"}}>View dashboard</button>
                      <button onClick={saveClient} style={{fontSize:13,padding:"9px 20px",borderRadius:tk.rLg,cursor:"pointer",border:"none",background:tk.teal,color:"white",fontWeight:600}}>Save</button>
                    </div>
                  </div>
                  {/* Macro stats */}
                  {cm&&(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:20}}>
                      {[["BMR",cm.bmr,"kcal"],["TDEE",cm.tdee,"kcal"],["Target",cm.targetCal,"kcal"],["Protein",cm.proteinG,"g"],["Fat",cm.fatG,"g"]].map(([l,v,u])=>(
                        <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:tk.r,padding:10,textAlign:"center"}}><div style={{fontSize:15,fontWeight:600}}>{v}{u}</div><div style={{fontSize:9,color:"var(--color-text-secondary)",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div></div>
                      ))}
                    </div>
                  )}
                  {/* Editable form */}
                  <h3 style={{fontSize:13,fontWeight:600,marginBottom:14,paddingTop:16,borderTop:tk.bd}}>Client details</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={lbl2}>Full name</label>
                      <input value={clientDraft.name} onChange={e=>setClientDraft(d=>({...d,name:e.target.value}))} style={inp2}/>
                    </div>
                    {[{k:"age",l:"Age (yrs)"},{k:"weight",l:"Weight (kg)"},{k:"height",l:"Height (cm)"}].map(({k,l})=>(
                      <div key={k}>
                        <label style={lbl2}>{l}</label>
                        <input type="number" min={0} value={clientDraft[k]} onChange={e=>setClientDraft(d=>({...d,[k]:+e.target.value}))} style={inp2}/>
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
                  </div>
                  <button onClick={saveClient} style={{width:"100%",marginTop:16,padding:"12px",borderRadius:tk.rLg,cursor:"pointer",border:"none",background:tk.teal,color:"white",fontWeight:600,fontSize:14}}>Save client</button>
                </div>
                {/* Recommended recipes */}
                <div style={crd}>
                  <h3 style={{fontSize:13,fontWeight:500,marginBottom:12}}>Recommended recipes for {clientDraft.name}</h3>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                    {recipes.filter(r=>parseArr(r.goal).includes(clientDraft.goal)).slice(0,4).map(r=><RecipeCard key={r.id} recipe={r} selected={selRecipe?.id===r.id} onSelect={r=>setSelRecipe(selRecipe?.id===r.id?null:r)}/>)}
                  </div>
                  {selRecipe&&<RecipeDetail recipe={selRecipe} onClose={()=>setSelRecipe(null)}/>}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

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
