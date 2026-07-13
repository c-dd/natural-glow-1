'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/Box';

// Marketing footer + Terms/Privacy legal modal, ported 1:1 from the source.

export default function Footer() {
  const router = useRouter();
  const [legal, setLegal] = useState(null); // null | 'terms' | 'privacy'
  const legalTitle = legal === 'privacy' ? 'Privacy summary' : 'Terms of use';

  return (
    <>
      <Box as="div" style="background:#9EAF8B;color:#4A5540;padding:6vh 5vw 4vh">
        <Box as="div" className="ng-footer" style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:32px">
          <Box as="div" className="ng-footer-brand">
            <Box as="div" style="display:flex;align-items:center;gap:9px">
              <img src="/ng-mark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
              <Box as="span" style="font:500 8px 'Space Mono',monospace;letter-spacing:.1em;color:#5A6B4B;border:1px solid rgba(185,111,116,.5);padding:2px 5px;border-radius:3px">RUO</Box>
            </Box>
            <Box as="p" style="margin:16px 0 0;max-width:280px;font:400 12px/1.7 'Manrope',sans-serif;color:#6E7A64">High-quality, research-grade peptides. Every lot verifiable by Certificate of Analysis.</Box>
          </Box>
          <Box as="div">
            <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#78826B;margin-bottom:14px">Catalog</Box>
            <Box as="div" onClick={() => router.push('/catalog')} style="font:500 12px 'Manrope',sans-serif;color:#4A5540;margin-bottom:9px;cursor:pointer;transition:color .2s ease" hover="color:#2E3627">All compounds</Box>
            <Box as="div" onClick={() => router.push('/verify')} style="font:500 12px 'Manrope',sans-serif;color:#4A5540;margin-bottom:9px;cursor:pointer;transition:color .2s ease" hover="color:#2E3627">Verify a COA</Box>
            <Box as="div" onClick={() => router.push('/science')} style="font:500 12px 'Manrope',sans-serif;color:#4A5540;cursor:pointer;transition:color .2s ease" hover="color:#2E3627">Science &amp; methods</Box>
          </Box>
          <Box as="div">
            <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#78826B;margin-bottom:14px">Company</Box>
            <Box as="div" onClick={() => router.push('/contact')} style="font:500 12px 'Manrope',sans-serif;color:#4A5540;margin-bottom:9px;cursor:pointer;transition:color .2s ease" hover="color:#2E3627">Contact</Box>
            <Box as="div" onClick={() => router.push('/signin')} style="font:500 12px 'Manrope',sans-serif;color:#4A5540;cursor:pointer;transition:color .2s ease" hover="color:#2E3627">Sign in</Box>
          </Box>
          <Box as="div">
            <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#78826B;margin-bottom:14px">Legal</Box>
            <Box as="div" onClick={() => setLegal('terms')} style="font:500 12px 'Manrope',sans-serif;color:#4A5540;margin-bottom:9px;cursor:pointer" hover="color:#2E3627">Terms of use</Box>
            <Box as="div" onClick={() => setLegal('privacy')} style="font:500 12px 'Manrope',sans-serif;color:#4A5540;cursor:pointer" hover="color:#2E3627">Privacy</Box>
          </Box>
        </Box>
        <Box as="div" style="max-width:900px;margin:36px auto 0;padding-top:22px;border-top:1px solid rgba(45,53,39,.09);font:400 10.5px/1.7 'Space Mono',monospace;color:#78826B">
          For Research Use Only. Not for human or animal consumption. These statements have not been evaluated by the FDA. Products are not intended to diagnose, treat, cure, or prevent any disease. © 2026 Natural Glow Research.
        </Box>
      </Box>

      {/* ========= LEGAL POPUP ============ */}
      {legal && (
        <Box as="div" onClick={() => setLegal(null)} style="position:fixed;inset:0;background:rgba(45,53,39,.48);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:86;padding:20px;animation:ngFade .3s ease">
          <Box as="div" onClick={(e) => e.stopPropagation()} style="width:520px;max-width:100%;max-height:86vh;overflow:auto;background:#FFFFFF;border:1px solid rgba(45,53,39,.13);border-radius:18px;box-shadow:0 44px 90px -30px rgba(45,53,39,.65);animation:ngPop .4s cubic-bezier(.2,.7,.2,1)">
            <Box as="div" style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid rgba(45,53,39,.09)">
              <Box as="span" style="font:600 13.5px 'Manrope',sans-serif">{legalTitle}</Box>
              <Box as="span" onClick={() => setLegal(null)} style="cursor:pointer;font:400 20px 'Manrope',sans-serif;color:#99A18C;line-height:1;transition:color .2s ease" hover="color:#2E3627">×</Box>
            </Box>
            <Box as="div" style="padding:22px 26px 26px">
              <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#5A6B4B;margin-bottom:14px">For Research Use Only</Box>
              {legal === 'terms' && (
                <>
                  <Box as="p" style="margin:0 0 14px;font:400 13px/1.75 'Manrope',sans-serif;color:#4A5540">All products sold by Natural Glow are research-grade reference materials supplied strictly For Research Use Only (RUO). They are not drugs, foods, cosmetics, or medical devices, and are not intended for human or animal consumption, diagnosis, or treatment.</Box>
                  <Box as="p" style="margin:0 0 14px;font:400 13px/1.75 'Manrope',sans-serif;color:#4A5540">By placing an order you confirm that you are a qualified researcher or institution and that all materials will be handled by trained personnel in an appropriate laboratory setting, in compliance with applicable laws and regulations.</Box>
                  <Box as="p" style="margin:0;font:400 13px/1.75 'Manrope',sans-serif;color:#4A5540">This is a demonstration storefront. Orders, payments, and certificates shown here are simulated and create no binding obligation.</Box>
                </>
              )}
              {legal === 'privacy' && (
                <>
                  <Box as="p" style="margin:0 0 14px;font:400 13px/1.75 'Manrope',sans-serif;color:#4A5540">We collect only the account and shipping details you provide, in order to process research orders and issue Certificates of Analysis. We do not sell your information.</Box>
                  <Box as="p" style="margin:0 0 14px;font:400 13px/1.75 'Manrope',sans-serif;color:#4A5540">Account details in this demo are stored locally in your browser and are never transmitted to a server. Clearing your browser storage removes them.</Box>
                  <Box as="p" style="margin:0;font:400 13px/1.75 'Manrope',sans-serif;color:#4A5540">This is a demonstration storefront. No real personal data is processed and no tracking is performed.</Box>
                </>
              )}
              <Box as="span" onClick={() => setLegal(null)} style="display:block;text-align:center;margin-top:18px;font:600 13px 'Manrope',sans-serif;padding:13px;border-radius:999px;color:#2E3627;background:#9EAF8B;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">Close</Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
