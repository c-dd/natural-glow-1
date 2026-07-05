'use client';

import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toasts from '@/components/Toast';

const METHODS = [
  { t: 'HPLC', tag: 'Characterization', d: 'Reverse-phase HPLC characterizes every batch, reported per lot on the Certificate of Analysis.' },
  { t: 'ESI-MS', tag: 'Identity', d: 'Electrospray mass spectrometry confirms the exact peptide mass and identity for each batch.' },
  { t: 'Lot tracking', tag: 'Traceability', d: 'Every vial is tied to its production lot, with documentation from synthesis through release.' },
];

export default function SciencePage() {
  return (
    <>
      <Gate>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F3ED', color: '#14161A' }}>
          <Header active="science" />
          <div style={{ flex: 1, minHeight: 0 }}>

            {/* ============ SCIENCE ============ */}
            <Box as="div" style="animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="div" style="padding:8vh 5vw 6vh;border-bottom:1px solid rgba(20,22,26,.09)">
                <Box as="div" style="max-width:900px;margin:0 auto">
                  <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:#96702E;margin-bottom:16px">Quality &amp; methods</Box>
                  <Box as="h1" style="margin:0;font:300 clamp(36px,4vw,54px)/1.05 'Spectral',serif;letter-spacing:-.01em">Tested, <span style={{ fontStyle: 'italic' }}>not estimated.</span></Box>
                  <Box as="p" style="margin:18px 0 0;font:400 15px/1.75 'Manrope',sans-serif;color:#4E545B;text-wrap:pretty">We treat every batch as a reference material. Every lot is characterized analytically and reported on a lot-specific Certificate of Analysis — so what's on the label is what's in the vial.</Box>
                </Box>
              </Box>
              <Box as="div" style="padding:7vh 5vw 9vh">
                <Box as="div" className="ng-grid3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;max-width:900px;margin:0 auto">
                  {METHODS.map((m) => (
                    <Box key={m.t} as="div" style="background:#fff;border:1px solid rgba(20,22,26,.1);border-radius:14px;padding:28px;transition:transform .25s ease, box-shadow .25s ease" hover="transform:translateY(-3px);box-shadow:0 20px 44px -26px rgba(20,22,26,.3)">
                      <Box as="div" style="font:600 25px 'Spectral',serif;color:#14161A">{m.t}</Box>
                      <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#96702E;margin:10px 0 14px">{m.tag}</Box>
                      <Box as="p" style="margin:0;font:400 13px/1.7 'Manrope',sans-serif;color:#4E545B">{m.d}</Box>
                    </Box>
                  ))}
                </Box>
                <Box as="div" style="margin-top:44px;background:#14161A;color:#F5F3ED;border-radius:16px;padding:38px 40px;max-width:900px;margin-left:auto;margin-right:auto">
                  <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:#C9A15E;margin-bottom:14px">Research use only</Box>
                  <Box as="h2" style="margin:0;font:300 26px/1.4 'Spectral',serif;max-width:680px;text-wrap:pretty">These materials are intended solely for laboratory research. They are not drugs, cosmetics, or foods, and are not intended to diagnose, treat, cure, or prevent any disease, or for human or animal consumption.</Box>
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
