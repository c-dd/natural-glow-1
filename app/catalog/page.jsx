'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toasts from '@/components/Toast';
import { useProducts, useAuth } from '@/lib/store';

const chipStyle = (a) =>
  "font:500 11px 'Manrope',sans-serif;padding:8px 16px;border-radius:999px;cursor:pointer;transition:border-color .2s ease;" +
  (a
    ? 'color:#2E3627;background:#9EAF8B;border:1px solid #2E3627;'
    : 'color:#4A5540;background:#fff;border:1px solid rgba(45,53,39,.14);');

const CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'copper', label: 'Copper peptides', cat: 'Copper peptides' },
  { key: 'signal', label: 'Signal peptides', cat: 'Signal peptides' },
  { key: 'metabolic', label: 'Metabolic', cat: 'Metabolic' },
];

export default function CatalogPage() {
  const router = useRouter();
  const products = useProducts();
  const signedIn = useAuth();
  const [filter, setFilter] = useState('all');

  const active = CHIPS.find((c) => c.key === filter);
  const list = filter === 'all' ? products : products.filter((p) => p.cat === active.cat);

  return (
    <>
      <Gate>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFDFE0', color: '#2E3627' }}>
          <Header active="catalog" />
          <div style={{ flex: 1, minHeight: 0 }}>

            {/* ============ CATALOG ============ */}
            <Box as="div" style="padding:7vh 5vw 9vh;animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="div" style="max-width:900px;margin:0 auto">
                <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:#5A6B4B;margin-bottom:14px">Reference materials · RUO</Box>
                <Box as="h1" style="margin:0;font:300 clamp(36px,4vw,52px)/1.05 'Spectral',serif;letter-spacing:-.01em">Peptide catalog</Box>
                <Box as="p" style="margin:16px 0 0;max-width:540px;font:400 14.5px/1.7 'Manrope',sans-serif;color:#4A5540;text-wrap:pretty">Lyophilized peptide reference materials for laboratory research. Each compound ships with a lot-specific Certificate of Analysis. Not for human or animal consumption.</Box>
                <Box as="div" className="ng-chips" style="display:flex;gap:10px;margin:30px 0 28px">
                  {CHIPS.map((c) => (
                    <Box key={c.key} as="span" onClick={() => setFilter(c.key)} style={chipStyle(filter === c.key)} hover="border-color:rgba(45,53,39,.4)">{c.label}</Box>
                  ))}
                </Box>
                <Box as="div" className="ng-grid3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px">
                  {list.map((p) => (
                    <Box key={p.id} as="div" onClick={() => router.push(`/product?id=${p.id}`)} style="background:#fff;border:1px solid rgba(45,53,39,.1);border-radius:14px;padding:26px;cursor:pointer;display:flex;flex-direction:column;gap:15px;transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease" hover="transform:translateY(-3px);box-shadow:0 20px 44px -26px rgba(45,53,39,.35);border-color:rgba(90,107,75,.45)">
                      <Box as="div" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
                        <div>
                          <Box as="div" style="font:600 17px 'Manrope',sans-serif">{p.name}</Box>
                          <Box as="div" style="font:400 12px 'Manrope',sans-serif;color:#78826B;margin-top:4px">{p.sub}</Box>
                        </div>
                      </Box>
                      <Box as="p" style="margin:0;font:400 12.5px/1.6 'Manrope',sans-serif;color:#4A5540">{p.blurb}</Box>
                      <Box as="div" style="display:flex;justify-content:space-between;align-items:center;padding-top:15px;border-top:1px solid rgba(45,53,39,.08);margin-top:auto">
                        <Box as="span" style="font:500 10px 'Space Mono',monospace;letter-spacing:.08em;color:#78826B">{p.mg} · LOT {p.lot}</Box>
                        <Box as="span" style="font:600 12.5px 'Manrope',sans-serif;color:#2E3627">{signedIn ? 'View →' : 'Sign in →'}</Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

          </div>
          <Footer />
        </div>
      </Gate>
      <Toasts />
    </>
  );
}
