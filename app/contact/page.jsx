'use client';

import { useState } from 'react';
import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toasts from '@/components/Toast';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <Gate>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F3ED', color: '#14161A' }}>
          <Header active="contact" />
          <div style={{ flex: 1, minHeight: 0 }}>

            {/* ============ CONTACT ============ */}
            <Box as="div" style="padding:7vh 5vw 9vh;animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="div" className="ng-2col" style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:52px">
                <div>
                  <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:#96702E;margin-bottom:16px">Get in touch</Box>
                  <Box as="h1" style="margin:0;font:300 clamp(34px,3.6vw,48px)/1.05 'Spectral',serif;letter-spacing:-.01em">Work with us.</Box>
                  <Box as="p" style="margin:18px 0 0;font:400 14.5px/1.75 'Manrope',sans-serif;color:#4E545B;text-wrap:pretty">Questions about compounds, lots, or wholesale? Tell us about your lab and we'll follow up, usually within two business days.</Box>
                  <Box as="div" style="margin-top:32px;display:flex;flex-direction:column;gap:18px">
                    <div><Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#96702E">Email</Box><Box as="div" style="font:500 14px 'Manrope',sans-serif;margin-top:5px">research@naturalglow.bio</Box></div>
                    <div><Box as="div" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#96702E">Lot / COA questions</Box><Box as="div" style="font:500 14px 'Manrope',sans-serif;margin-top:5px">quality@naturalglow.bio</Box></div>
                  </Box>
                </div>
                <Box as="div" style="background:#fff;border:1px solid rgba(20,22,26,.11);border-radius:16px;padding:30px">
                  {!sent && (
                    <Box as="div" style="display:flex;flex-direction:column;gap:15px">
                      <div><Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6B7178;margin-bottom:6px">Full name</Box><Box as="input" placeholder="Dr. Jane Okafor" style="width:100%;font:500 14px 'Manrope',sans-serif;color:#14161A;background:#F7F5EF;border:1.5px solid rgba(20,22,26,.13);border-radius:10px;padding:12px 13px" /></div>
                      <div><Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6B7178;margin-bottom:6px">Institution / lab</Box><Box as="input" placeholder="Institute of Molecular Research" style="width:100%;font:500 14px 'Manrope',sans-serif;color:#14161A;background:#F7F5EF;border:1.5px solid rgba(20,22,26,.13);border-radius:10px;padding:12px 13px" /></div>
                      <div><Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6B7178;margin-bottom:6px">Work email</Box><Box as="input" placeholder="jane@lab.edu" style="width:100%;font:500 14px 'Manrope',sans-serif;color:#14161A;background:#F7F5EF;border:1.5px solid rgba(20,22,26,.13);border-radius:10px;padding:12px 13px" /></div>
                      <div><Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6B7178;margin-bottom:6px">Message</Box><Box as="textarea" rows="3" placeholder="How can we help?" style="width:100%;font:500 14px 'Manrope',sans-serif;color:#14161A;background:#F7F5EF;border:1.5px solid rgba(20,22,26,.13);border-radius:10px;padding:12px 13px;resize:vertical" /></div>
                      <Box as="span" onClick={() => setSent(true)} style="text-align:center;font:600 13px 'Manrope',sans-serif;color:#F5F3ED;background:#14161A;padding:14px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#2A2E34">Send message</Box>
                    </Box>
                  )}
                  {sent && (
                    <Box as="div" style="text-align:center;padding:34px 10px;animation:ngRise .4s cubic-bezier(.2,.7,.2,1)">
                      <Box as="div" style="display:inline-grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#3E7C5B;color:#fff;font-size:22px;margin-bottom:16px;animation:ngStamp .5s cubic-bezier(.34,1.56,.64,1)">✓</Box>
                      <Box as="h2" style="margin:0;font:300 27px 'Spectral',serif">Message received.</Box>
                      <Box as="p" style="margin:10px auto 0;max-width:300px;font:400 13px/1.65 'Manrope',sans-serif;color:#4E545B">Thanks — our team will follow up by email, usually within two business days.</Box>
                      <Box as="span" onClick={() => setSent(false)} style="display:inline-block;margin-top:18px;font:600 12px 'Manrope',sans-serif;color:#96702E;cursor:pointer">Send another →</Box>
                    </Box>
                  )}
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
