// ============================================================================
// natural-glow — SHARED CATALOG DATA (the WS0 ⇄ WS1 contract)
//
// Pure data + pure functions. NO React, NO localStorage, NO DOM. This exact
// module is imported by the browser store (lib/store.js) AND — later — by
// serverless seed code, so it must stay dependency-free ESM.
//
// COA IS OPTIONAL. Research compounds carry BOTH a purity and a lot and
// therefore a Certificate of Analysis. Consumables (lipotropics, beauty
// products, supplies) carry `purity: null, lot: null` — a syringe kit has no
// COA — so `released` is null for them and every surface must degrade
// gracefully rather than print "LOT null".
//
// Product shape:
//   { id, name, sub, cat, mg, purity|null, lot|null, price, released|null, featured? }
// ============================================================================

export const BASE_PRODUCTS = [
  // ---------- Weight Management & Metabolic ----------
  { id: 'tirzepatide-10',    name: 'Tirzepatide',    sub: 'GIP/GLP-1 receptor agonist',               cat: 'Weight Management & Metabolic', mg: '10 mg',    purity: '99.4%', lot: '26·0701', price: 95,  released: '14 Jan 2026', featured: true },
  { id: 'tirzepatide-20',    name: 'Tirzepatide',    sub: 'GIP/GLP-1 receptor agonist',               cat: 'Weight Management & Metabolic', mg: '20 mg',    purity: '99.3%', lot: '26·0702', price: 140, released: '22 Jan 2026' },
  { id: 'tirzepatide-30',    name: 'Tirzepatide',    sub: 'GIP/GLP-1 receptor agonist',               cat: 'Weight Management & Metabolic', mg: '30 mg',    purity: '99.5%', lot: '26·0703', price: 180, released: '3 Feb 2026' },
  { id: 'tirzepatide-40',    name: 'Tirzepatide',    sub: 'GIP/GLP-1 receptor agonist',               cat: 'Weight Management & Metabolic', mg: '40 mg',    purity: '99.2%', lot: '26·0704', price: 215, released: '17 Feb 2026' },
  { id: 'retatrutide-10',    name: 'Retatrutide',    sub: 'GIP/GLP-1/glucagon triple agonist',        cat: 'Weight Management & Metabolic', mg: '10 mg',    purity: '99.6%', lot: '26·0705', price: 150, released: '2 Mar 2026' },
  { id: 'retatrutide-15',    name: 'Retatrutide',    sub: 'GIP/GLP-1/glucagon triple agonist',        cat: 'Weight Management & Metabolic', mg: '15 mg',    purity: '99.4%', lot: '26·0706', price: 195, released: '11 Mar 2026' },
  { id: 'cagrilintide-5',    name: 'Cagrilintide',   sub: 'Long-acting amylin analog',                cat: 'Weight Management & Metabolic', mg: '5 mg',     purity: '99.3%', lot: '26·0707', price: 120, released: '24 Mar 2026' },
  { id: 'aod-9604-5',        name: 'AOD-9604',       sub: 'hGH fragment 176-191 · Recon w/ AA Water',  cat: 'Weight Management & Metabolic', mg: '5 mg',     purity: '99.1%', lot: '26·0708', price: 70,  released: '6 Apr 2026' },
  { id: 'amino-1mq-5',       name: '5-Amino-1MQ',    sub: 'NNMT inhibitor',                           cat: 'Weight Management & Metabolic', mg: '5 mg',     purity: '99.0%', lot: '26·0709', price: 55,  released: '15 Apr 2026' },
  { id: 'amino-1mq-50',      name: '5-Amino-1MQ',    sub: 'NNMT inhibitor',                           cat: 'Weight Management & Metabolic', mg: '50 mg',    purity: '99.2%', lot: '26·0710', price: 130, released: '28 Apr 2026' },
  { id: 'slupp-332-5',       name: 'SLUPP-332',      sub: 'Pan-ERR agonist',                          cat: 'Weight Management & Metabolic', mg: '5 mg',     purity: '99.5%', lot: '26·0711', price: 90,  released: '7 May 2026' },
  { id: 'klow-80',           name: 'KLOW',           sub: 'Multi-peptide research blend',             cat: 'Weight Management & Metabolic', mg: '80 mg',    purity: '99.0%', lot: '26·0712', price: 175, released: '19 May 2026' },

  // ---------- Growth Hormone & Performance ----------
  { id: 'ipamorelin-10',     name: 'Ipamorelin',     sub: 'Growth hormone secretagogue',              cat: 'Growth Hormone & Performance',  mg: '10 mg',    purity: '99.3%', lot: '26·0713', price: 60,  released: '1 Jun 2026' },
  { id: 'tesamorelin-10',    name: 'Tesamorelin',    sub: 'GHRH analog',                              cat: 'Growth Hormone & Performance',  mg: '10 mg',    purity: '99.5%', lot: '26·0714', price: 135, released: '9 Jun 2026' },
  { id: 'wolverine-10',      name: 'Wolverine',      sub: 'BPC-157 · TB-500 blend',                   cat: 'Growth Hormone & Performance',  mg: '10 mg',    purity: '99.1%', lot: '26·0715', price: 115, released: '18 Jun 2026' },
  { id: 'mots-c-10',         name: 'MOTS-C',         sub: 'Mitochondrial-derived peptide',            cat: 'Growth Hormone & Performance',  mg: '10 mg',    purity: '99.2%', lot: '26·0716', price: 110, released: '26 Jun 2026' },

  // ---------- Skin, Hair & Beauty ----------
  { id: 'ghk-cu-50',         name: 'GHK-Cu',         sub: 'Copper tripeptide-1',                      cat: 'Skin, Hair & Beauty',           mg: '50 mg',    purity: '99.2%', lot: '26·0717', price: 65,  released: '2 Jul 2026', featured: true },
  { id: 'ghk-cu-100',        name: 'GHK-Cu',         sub: 'Copper tripeptide-1',                      cat: 'Skin, Hair & Beauty',           mg: '100 mg',   purity: '99.4%', lot: '26·0718', price: 95,  released: '8 Jul 2026' },
  { id: 'ghk-cu-raw-1g',     name: 'GHK-Cu (RAW)',   sub: 'Copper tripeptide-1 · raw powder',         cat: 'Skin, Hair & Beauty',           mg: '1 g',      purity: '99.6%', lot: '26·0719', price: 145, released: '13 May 2026' },
  { id: 'ahk-cu-raw-1g',     name: 'AHK-Cu (RAW)',   sub: 'Copper tripeptide AHK · raw powder',       cat: 'Skin, Hair & Beauty',           mg: '1 g',      purity: '99.3%', lot: '26·0720', price: 160, released: '20 Apr 2026' },

  // ---------- Immune & Recovery ----------
  { id: 'thymosin-alpha-1-5', name: 'Thymosin Alpha-1', sub: 'Thymic peptide Tα1',                    cat: 'Immune & Recovery',             mg: '5 mg',     purity: '99.5%', lot: '26·0721', price: 125, released: '5 Feb 2026' },
  { id: 'kpv-10',            name: 'KPV',            sub: 'α-MSH tripeptide (Lys-Pro-Val)',           cat: 'Immune & Recovery',             mg: '10 mg',    purity: '99.4%', lot: '26·0722', price: 85,  released: '27 Feb 2026' },
  { id: 'nad-500',           name: 'NAD+',           sub: 'Nicotinamide adenine dinucleotide',        cat: 'Immune & Recovery',             mg: '500 mg',   purity: '99.5%', lot: '26·0723', price: 90,  released: '30 Jun 2026', featured: true },
  { id: 'vitamin-c-20ml',    name: 'Vitamin C',      sub: 'Ascorbic acid solution',                   cat: 'Immune & Recovery',             mg: '20 ml',    purity: '99.1%', lot: '26·0724', price: 35,  released: '21 May 2026' },

  // ---------- Lipotropic & Wellness (no COA) ----------
  { id: 'lipo-c-b12-10ml',   name: 'Lipo-C / B12',   sub: 'MIC lipotropic blend with B12',            cat: 'Lipotropic & Wellness',         mg: '10 ml',    purity: null, lot: null, price: 45, released: null },
  { id: 'fat-blaster',       name: 'Fat Blaster',    sub: 'Lipotropic blend',                         cat: 'Lipotropic & Wellness',         mg: '1 vial',   purity: null, lot: null, price: 60, released: null },
  { id: 'dr-lipo-plus',      name: 'Dr. Lipo+',      sub: 'Lipotropic solution',                      cat: 'Lipotropic & Wellness',         mg: '1 vial',   purity: null, lot: null, price: 65, released: null },

  // ---------- Beauty & Wellness Products (no COA) ----------
  { id: 'pine-bottle',       name: 'Pine Bottle',    sub: 'Bottled beauty solution',                  cat: 'Beauty & Wellness Products',    mg: '1 bottle', purity: null, lot: null, price: 55, released: null },
  { id: 'lemon-bottle',      name: 'Lemon Bottle',   sub: 'Bottled beauty solution',                  cat: 'Beauty & Wellness Products',    mg: '1 bottle', purity: null, lot: null, price: 50, released: null },
  { id: 'pink-korean-gluta-1200', name: 'Pink Korean Gluta', sub: 'Glutathione complex',              cat: 'Beauty & Wellness Products',    mg: '1200 mg',  purity: null, lot: null, price: 70, released: null },
  { id: 'reduce-gluta-1500', name: 'Reduce Gluta',   sub: 'Reduced glutathione',                      cat: 'Beauty & Wellness Products',    mg: '1500 mg',  purity: null, lot: null, price: 80, released: null },

  // ---------- Supplies & Accessories (no COA) ----------
  { id: 'bac-water-3ml',     name: 'Bac Water',      sub: 'Bacteriostatic water',                     cat: 'Supplies & Accessories',        mg: '3 ml',     purity: null, lot: null, price: 6,  released: null },
  { id: 'bac-water-10ml',    name: 'Bac Water',      sub: 'Bacteriostatic water',                     cat: 'Supplies & Accessories',        mg: '10 ml',    purity: null, lot: null, price: 12, released: null },
  { id: 'aa-water-3ml',      name: 'AA Water',       sub: 'Acetic acid water for reconstitution',     cat: 'Supplies & Accessories',        mg: '3 ml',     purity: null, lot: null, price: 8,  released: null },
  { id: 'syringe-kit',       name: 'Syringe Kit',    sub: '10 insulin syringes + alcohol wipes',      cat: 'Supplies & Accessories',        mg: '1 kit',    purity: null, lot: null, price: 15, released: null },
  { id: 'muchcaine-lido-cream-10oz', name: 'Muchcaine Lido Cream', sub: 'Topical lidocaine cream',    cat: 'Supplies & Accessories',        mg: '10 oz',    purity: null, lot: null, price: 38, released: null },
];

// The 7 live categories, in catalog order.
export const CATEGORIES = [
  'Weight Management & Metabolic',
  'Growth Hormone & Performance',
  'Skin, Hair & Beauty',
  'Immune & Recovery',
  'Lipotropic & Wellness',
  'Beauty & Wellness Products',
  'Supplies & Accessories',
];

// A product has a COA only when it carries BOTH a purity and a lot.
export const hasCOA = (p) => !!(p && p.purity && p.lot);

// Presentation form. COA-less consumables just state their size — we never
// claim a dosage form (a bottle of bac water is not a "lyophilized vial").
const formatFor = (p) => {
  const size = String(p.mg || '').trim();
  if (!hasCOA(p)) return size;
  if (/\braw\b/i.test(p.name)) return `${size} raw powder`;
  if (/\bml\b/i.test(size)) return `${size} solution vial`;
  return `${size} lyophilized vial`;
};

// Cart / order meta line. Falls back to the plain size when there is no COA.
const metaFor = (p) => {
  const parts = [];
  if (p.lot) parts.push(`LOT ${p.lot}`);
  if (p.purity) parts.push(p.purity);
  return parts.length ? parts.join(' · ') : String(p.mg || '');
};

// Derive display-only fields so callers can use p.coa/format/cartName/cartMeta.
export const decorate = (p) => ({
  ...p,
  coa: hasCOA(p),
  format: formatFor(p),
  cartName: `${p.name} ${p.mg}`,
  cartMeta: metaFor(p),
});

// Seed on-hand stock ({ id: qty }). Ported from the source-of-truth inventory.
export const SEED_STOCK = {
  // Weight Management & Metabolic
  'tirzepatide-10': 120, 'tirzepatide-20': 96, 'tirzepatide-30': 74, 'tirzepatide-40': 48,
  'retatrutide-10': 62, 'retatrutide-15': 41, 'cagrilintide-5': 88, 'aod-9604-5': 57,
  'amino-1mq-5': 73, 'amino-1mq-50': 45, 'slupp-332-5': 18, 'klow-80': 52,
  // Growth Hormone & Performance
  'ipamorelin-10': 134, 'tesamorelin-10': 66, 'wolverine-10': 79, 'mots-c-10': 44,
  // Skin, Hair & Beauty
  'ghk-cu-50': 118, 'ghk-cu-100': 63, 'ghk-cu-raw-1g': 27, 'ahk-cu-raw-1g': 12,
  // Immune & Recovery
  'thymosin-alpha-1-5': 58, 'kpv-10': 91, 'nad-500': 105, 'vitamin-c-20ml': 76,
  // Lipotropic & Wellness
  'lipo-c-b12-10ml': 84, 'fat-blaster': 49, 'dr-lipo-plus': 0,
  // Beauty & Wellness Products
  'pine-bottle': 46, 'lemon-bottle': 68, 'pink-korean-gluta-1200': 55, 'reduce-gluta-1500': 40,
  // Supplies & Accessories
  'bac-water-3ml': 150, 'bac-water-10ml': 142, 'aa-water-3ml': 97, 'syringe-kit': 130,
  'muchcaine-lido-cream-10oz': 33,
};
