'use client';

import { useState, useEffect } from 'react';
import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toasts from '@/components/Toast';
import { useProducts, RELEASED } from '@/lib/store';

const addDays = (iso, d) => {
  const x = new Date(iso + 'T00:00:00');
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

const COA_ROWS = [
  { k: 'Appearance', v: 'White to off-white powder' },
  { k: 'Identity (ESI-MS)', v: 'Conforms' },
  { k: 'Water content (KF)', v: '< 6.0%' },
  { k: 'Acetate content', v: '< 12%' },
];

export default function VerifyPage() {
  const products = useProducts();
  const [lotInput, setLotInput] = useState('');
  const [result, setResult] = useState('idle'); // 'idle' | 'notfound' | product
  const [triedLot, setTriedLot] = useState('');

  const doVerify = (raw) => {
    const value = raw != null ? raw : lotInput;
    const key = (value || '').trim().toUpperCase();
    const norm = key.startsWith('NG-') ? key : (key ? 'NG-' + key.replace(/^NG/, '') : key);
    const p = products.find((x) => x.lot.toUpperCase() === key || x.lot.toUpperCase() === norm);
    setResult(p || 'notfound');
    setTriedLot(value);
  };

  // Deep-link ?lot= → prefill + auto-verify (client-side only, no useSearchParams).
  useEffect(() => {
    try {
      const lot = new URLSearchParams(window.location.search).get('lot');
      if (lot) { setLotInput(lot); doVerify(lot); }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyFound = result && result !== 'idle' && result !== 'notfound';
  const verifyNotFound = result === 'notfound';

  let record = null;
  if (verifyFound) {
    const rel = RELEASED[result.lot] || '2026-01-01';
    record = {
      name: result.name, sub: result.sub, lot: result.lot,
      released: rel, retest: addDays(rel, 730),
      analyst: 'M. Reyes, QC', ref: 'COA-' + result.lot.replace('NG-', '') + '-A',
      rows: COA_ROWS,
    };
  }

  return (
    <>
      <Gate>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFDFE0', color: '#2E3627' }}>
          <Header active="verify" />
          <div style={{ flex: 1, minHeight: 0 }}>

            {/* ============ VERIFY COA ============ */}
            <Box as="div" style="padding:7vh 5vw 9vh;animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="div" style="max-width:740px;margin:0 auto">
                <Box as="div" style="text-align:center">
                  <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:#5A6B4B;margin-bottom:14px">Certificate of Analysis</Box>
                  <Box as="h1" style="margin:0;font:300 clamp(36px,4vw,52px)/1.05 'Spectral',serif;letter-spacing:-.01em">Verify a lot</Box>
                  <Box as="p" style="margin:16px auto 0;max-width:460px;font:400 14.5px/1.7 'Manrope',sans-serif;color:#4A5540;text-wrap:pretty">Enter the lot number printed on your vial to retrieve its Certificate of Analysis, tied to that exact batch.</Box>
                </Box>
                <Box as="div" style="display:flex;gap:10px;margin:32px auto 0;max-width:520px">
                  <Box as="input" value={lotInput} onChange={(e) => setLotInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doVerify(); }} placeholder="e.g. NG-0421" style="flex:1;font:500 15px 'Space Mono',monospace;letter-spacing:.06em;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.16);border-radius:11px;padding:15px 16px;text-transform:uppercase;transition:border-color .2s ease" />
                  <Box as="span" onClick={() => doVerify()} style="font:600 13px 'Manrope',sans-serif;color:#2E3627;background:#9EAF8B;padding:15px 26px;border-radius:11px;cursor:pointer;white-space:nowrap;transition:all .2s ease" hover="background:#8A9E76">Verify</Box>
                </Box>
                <Box as="div" style="text-align:center;margin-top:14px;font:400 11px 'Manrope',sans-serif;color:#99A18C">Try <Box as="span" onClick={() => setLotInput('NG-0421')} style="font-family:'Space Mono',monospace;color:#5A6B4B;cursor:pointer">NG-0421</Box> or <Box as="span" onClick={() => setLotInput('NG-0388')} style="font-family:'Space Mono',monospace;color:#5A6B4B;cursor:pointer">NG-0388</Box></Box>

                {verifyNotFound && (
                  <Box as="div" style="margin-top:30px;background:#FFF1F1;border:1px solid rgba(168,68,46,.3);border-radius:14px;padding:22px 24px;text-align:center;animation:ngRise .4s cubic-bezier(.2,.7,.2,1)">
                    <Box as="div" style="font:600 14px 'Manrope',sans-serif;color:#A8442E">No certificate found for “{triedLot}”.</Box>
                    <Box as="div" style="font:400 12.5px/1.65 'Manrope',sans-serif;color:#6E7A64;margin-top:6px">Check the lot number against the label. If it still doesn't resolve, contact us to confirm authenticity before use.</Box>
                  </Box>
                )}

                {verifyFound && (
                  <Box as="div" style="margin-top:30px;background:#fff;border:1px solid rgba(45,53,39,.13);border-radius:16px;overflow:hidden;box-shadow:0 24px 56px -32px rgba(45,53,39,.45);animation:ngRise .45s cubic-bezier(.2,.7,.2,1)">
                    <Box as="div" style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#9EAF8B;color:#2E3627">
                      <Box as="div" style="display:flex;align-items:center;gap:10px">
                        <Box as="span" style="display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#3E7C5B;color:#fff;font-size:12px;animation:ngStamp .5s cubic-bezier(.34,1.56,.64,1)">✓</Box>
                        <Box as="span" style="font:600 12px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase">Verified authentic</Box>
                      </Box>
                      <Box as="span" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;color:#5A6B4B">Natural Glow · RUO</Box>
                    </Box>
                    <Box as="div" style="padding:26px 28px">
                      <Box as="div" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
                        <div>
                          <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#5A6B4B">Certificate of Analysis</Box>
                          <Box as="h2" style="margin:8px 0 0;font:300 30px/1.05 'Spectral',serif">{record.name}</Box>
                          <Box as="div" style="font:400 13px 'Manrope',sans-serif;color:#78826B;margin-top:4px">{record.sub}</Box>
                        </div>
                        <Box as="div" style="text-align:right">
                          <Box as="div" style="font:600 15px 'Space Mono',monospace;color:#2E3627">LOT {record.lot}</Box>
                          <Box as="div" style="font:400 11px 'Manrope',sans-serif;color:#78826B;margin-top:4px">Released {record.released} · Retest {record.retest}</Box>
                        </Box>
                      </Box>
                      <Box as="div" style="margin-top:22px;border:1px solid rgba(45,53,39,.11);border-radius:12px;overflow:hidden">
                        <Box as="div" style="display:flex;justify-content:space-between;padding:11px 16px;background:#FFDFE0;font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#78826B"><span>Test</span><span>Result</span></Box>
                        {record.rows.map((row) => (
                          <Box key={row.k} as="div" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-top:1px solid rgba(45,53,39,.07);font:500 12.5px 'Manrope',sans-serif">
                            <Box as="span" style="color:#4A5540">{row.k}</Box>
                            <Box as="span" style="font-family:'Space Mono',monospace;color:#2E3627">{row.v}</Box>
                          </Box>
                        ))}
                      </Box>
                      <Box as="div" style="display:flex;justify-content:space-between;align-items:center;margin-top:22px;flex-wrap:wrap;gap:12px">
                        <Box as="div" style="font:400 10.5px/1.6 'Space Mono',monospace;color:#99A18C">Analyst: {record.analyst}<br />Method: RP-HPLC / ESI-MS · Ref {record.ref}</Box>
                        <Box as="span" onClick={() => { try { window.print(); } catch { /* noop */ } }} style="font:600 12px 'Manrope',sans-serif;color:#2E3627;background:#9EAF8B;padding:12px 22px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">Download PDF</Box>
                      </Box>
                    </Box>
                  </Box>
                )}

                <Box as="p" style="margin:32px auto 0;max-width:500px;text-align:center;font:400 11px/1.7 'Manrope',sans-serif;color:#99A18C;text-wrap:pretty">A Certificate of Analysis reports identity and batch testing for one specific lot. It does not constitute a medical or safety claim. All products are for research use only.</Box>
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
