'use client';

import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toasts from '@/components/Toast';
import { SITE_CONTACT } from '@/lib/siteContact';

// Contact is a direct-email presentation (mailto), not a form. There is no
// message-send backend, so the page never pretends to submit or "receive" a
// message — it opens the visitor's own mail client instead.
export default function ContactPage() {
  const mailto = `mailto:${SITE_CONTACT.email}`;
  const composeHref = `${mailto}?subject=${encodeURIComponent('Enquiry — Natural Glow')}`;

  return (
    <>
      <Gate>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFDFE0', color: '#2E3627' }}>
          <Header active="contact" />
          <div style={{ flex: 1, minHeight: 0 }}>

            {/* ============ CONTACT ============ */}
            <Box as="div" style="padding:7vh 5vw 9vh;animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="div" className="ng-2col" style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:52px">
                <div>
                  <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:#5A6B4B;margin-bottom:16px">Get in touch</Box>
                  <Box as="h1" style="margin:0;font:300 clamp(34px,3.6vw,48px)/1.05 'Spectral',serif;letter-spacing:-.01em">Work with us.</Box>
                  <Box as="p" style="margin:18px 0 0;font:400 14.5px/1.75 'Manrope',sans-serif;color:#4A5540;text-wrap:pretty">Questions about compounds, lots, or wholesale? Email us about your lab and we'll follow up, {SITE_CONTACT.responseTime}.</Box>
                  <Box as="div" style="margin-top:32px;display:flex;flex-direction:column;gap:18px">
                    <div>
                      <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#5A6B4B">Email</Box>
                      <Box as="a" href={mailto} style="display:inline-block;font:500 14px 'Manrope',sans-serif;color:#2E3627;text-decoration:none;margin-top:5px" hover="color:#5A6B4B">{SITE_CONTACT.email}</Box>
                    </div>
                    <div>
                      <Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#5A6B4B">Lot / COA questions</Box>
                      <Box as="div" style="font:400 12.5px/1.6 'Manrope',sans-serif;color:#4A5540;margin-top:5px">Include the lot number from your vial in your email and we'll confirm its Certificate of Analysis.</Box>
                    </div>
                  </Box>
                </div>
                <Box as="div" style="background:#fff;border:1px solid rgba(45,53,39,.11);border-radius:16px;padding:30px;display:flex;flex-direction:column;justify-content:center">
                  <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#5A6B4B;margin-bottom:12px">Send us a note</Box>
                  <Box as="p" style="margin:0 0 20px;font:400 13.5px/1.7 'Manrope',sans-serif;color:#4A5540;text-wrap:pretty">Use the button below to open a new email in your own mail app, addressed to our team. Tell us about your lab and what you need.</Box>
                  <Box as="a" href={composeHref} style="text-align:center;font:600 13px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:14px;border-radius:999px;cursor:pointer;text-decoration:none;transition:all .2s ease" hover="background:#8A9E76">Compose email →</Box>
                  <Box as="div" style="margin-top:14px;text-align:center;font:400 11px 'Manrope',sans-serif;color:#99A18C">Prefers your own inbox — nothing is submitted through this page.</Box>
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
