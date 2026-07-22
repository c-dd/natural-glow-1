'use client';

import { useRouter } from 'next/navigation';
import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toasts from '@/components/Toast';
import { useProducts, useAuth } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const products = useProducts();
  const signedIn = useAuth();
  const featured = products.filter((p) => p.featured).slice(0, 3);

  const openCard = (p) => router.push(signedIn ? `/product?id=${p.id}` : '/signin');

  return (
    <>
      <Gate>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFDFE0', color: '#2E3627' }}>
          <Header active="" />
          <div style={{ flex: 1, minHeight: 0 }}>

            {/* ============ HOME ============ */}
            <Box as="div" style="animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="div" style="border-bottom:1px solid rgba(45,53,39,.09);padding:0 5vw">
                <Box as="div" className="ng-hero" style="display:grid;grid-template-columns:1.04fr .96fr;max-width:900px;margin:0 auto">
                  <Box as="div" className="ng-hero-copy" style="padding:9vh 40px 9vh 0;display:flex;flex-direction:column;justify-content:center">
                    <Box as="h1" style="margin:0;font:300 clamp(42px,4.8vw,64px)/1.04 'Spectral',serif;letter-spacing:-.015em">High-quality,<br /><span style={{ fontStyle: 'italic' }}>research-grade</span> peptides.</Box>
                    <Box as="p" style="margin:26px 0 0;max-width:440px;font:400 15.5px/1.7 'Manrope',sans-serif;color:#4A5540;text-wrap:pretty">Lyophilized research peptides for laboratory use. HPLC- and mass-spec–verified, lot-tracked, and shipped with a Certificate of Analysis on every vial.</Box>
                    <Box as="div" className="ng-ctarow" style="display:flex;align-items:center;gap:24px;margin-top:36px">
                      <Box as="span" onClick={() => router.push('/catalog')} style="font:600 13px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:15px 30px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76;transform:translateY(-1px)">Browse the catalog</Box>
                      <Box as="span" onClick={() => router.push('/verify')} style="font:600 13px 'Manrope',sans-serif;color:#5A6B4B;cursor:pointer;border-bottom:1px solid transparent;transition:border-color .2s ease" hover="border-color:rgba(90,107,75,.5)">Verify a COA →</Box>
                    </Box>
                  </Box>
                  <Box as="div" className="ng-hero-img" style="position:relative;background:#FFF1F1;display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:480px;border-radius:16px;margin:24px 0 24px 24px">
                    <img src="/hero.jpeg" alt="Natural Glow NAD+ research vial" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                    <Box as="div" style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(45,53,39,.28),transparent 42%)" />
                  </Box>
                </Box>
              </Box>

              <Box as="div" style="padding:9vh 5vw 10vh">
                <Box as="div" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;max-width:900px;margin-left:auto;margin-right:auto">
                  <div>
                    <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:#5A6B4B;margin-bottom:12px">Reference catalog</Box>
                    <Box as="h2" style="margin:0;font:300 36px/1.1 'Spectral',serif;letter-spacing:-.01em">Featured compounds</Box>
                  </div>
                </Box>
                <Box as="div" className="ng-grid3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;max-width:900px;margin:0 auto">
                  {featured.map((p) => (
                    <Box key={p.id} as="div" onClick={() => openCard(p)} style="background:#fff;border:1px solid rgba(45,53,39,.1);border-radius:14px;padding:24px;cursor:pointer;display:flex;flex-direction:column;gap:16px;transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease" hover="transform:translateY(-3px);box-shadow:0 20px 44px -26px rgba(45,53,39,.35);border-color:rgba(90,107,75,.45)">
                      <Box as="div" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
                        <div>
                          <Box as="div" style="font:600 17px 'Manrope',sans-serif;letter-spacing:.01em">{p.name}</Box>
                          <Box as="div" style="font:400 12px 'Manrope',sans-serif;color:#78826B;margin-top:4px">{p.sub}</Box>
                        </div>
                      </Box>
                      <Box as="div" style="display:flex;justify-content:space-between;align-items:center;padding-top:15px;border-top:1px solid rgba(45,53,39,.08);margin-top:auto">
                        <Box as="span" style="font:500 10px 'Space Mono',monospace;letter-spacing:.08em;color:#78826B">{p.mg}{p.lot ? ` · LOT ${p.lot}` : ''}</Box>
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
