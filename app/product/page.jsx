'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toasts, { toast } from '@/components/Toast';
import { useProducts, useAuth, bumpCart } from '@/lib/store';

export default function ProductPage() {
  const router = useRouter();
  const products = useProducts();
  const signedIn = useAuth();
  const [pid, setPid] = useState('ghk-cu');

  // Read ?id= client-side only (static export, no useSearchParams).
  useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get('id');
      if (id) setPid(id);
    } catch { /* noop */ }
  }, []);

  const product = products.find((p) => p.id === pid) || products.find((p) => p.id === 'ghk-cu') || products[0];

  const specs = [
    { k: 'CAS number', v: product.cas || '—' },
    { k: 'Form', v: 'Lyophilized powder' },
    { k: 'Net peptide', v: product.mg },
    { k: 'Identity (MS)', v: 'Conforms' },
    { k: 'Current lot', v: product.lot },
  ];

  const addToCart = () => {
    if (signedIn) {
      bumpCart(product.id, 1);
      toast(`${product.name} added to cart`, { label: 'View cart →', onClick: () => router.push('/dashboard?view=catalog&cart=1') });
    } else {
      router.push('/signin');
    }
  };

  return (
    <>
      <Gate>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F3ED', color: '#14161A' }}>
          <Header active="catalog" />
          <div style={{ flex: 1, minHeight: 0 }}>

            {/* ============ PRODUCT ============ */}
            <Box as="div" style="padding:5vh 5vw 9vh;animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="div" style="max-width:900px;margin:0 auto">
                <Box as="div" style="font:500 11px 'Space Mono',monospace;letter-spacing:.06em;color:#96702E;margin-bottom:30px"><Box as="span" onClick={() => router.push('/catalog')} style="cursor:pointer;border-bottom:1px solid transparent;transition:border-color .2s ease" hover="border-color:rgba(150,112,46,.5)">CATALOG</Box> <Box as="span" style="color:#9BA1A8">/ {product.lot}</Box></Box>
                <Box as="div" className="ng-product" style="display:grid;grid-template-columns:.92fr 1.08fr;gap:48px;align-items:start">

                  {/* vial visual */}
                  <Box as="div" className="ng-product-img" style="position:relative;background:#EDE9DF;border:1px solid rgba(20,22,26,.09);border-radius:16px;min-height:460px;display:flex;align-items:center;justify-content:center;overflow:hidden">
                    <Box as="div" style="position:absolute;inset:0;background-image:linear-gradient(rgba(150,112,46,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(150,112,46,.05) 1px,transparent 1px);background-size:42px 42px" />
                    <Box as="div" style="position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(201,161,94,.15),transparent 65%)" />
                    <Box as="div" style="position:relative;z-index:1">
                      <Box as="div" style="animation:ngFloat 7s ease-in-out infinite">
                        <Box as="div" style="width:46px;height:17px;background:#96702E;border-radius:5px 5px 2px 2px;margin:0 auto" />
                        <Box as="div" style="width:50px;height:10px;background:#C6C1B4;border-radius:2px;margin:-1px auto 0" />
                        <Box as="div" style="width:30px;height:14px;background:rgba(255,255,255,.5);border-left:1px solid rgba(20,22,26,.15);border-right:1px solid rgba(20,22,26,.15);margin:0 auto" />
                        <Box as="div" style="position:relative;width:130px;height:196px;background:linear-gradient(160deg,rgba(255,255,255,.78),rgba(238,235,227,.94));border:1.5px solid #14161A;border-radius:6px 6px 11px 11px;overflow:hidden;box-shadow:0 32px 60px -24px rgba(20,22,26,.5)">
                          <Box as="div" style="position:absolute;bottom:0;left:0;right:0;height:42px;background:linear-gradient(#F7F5EF,#E5E1D5);border-top:1px solid rgba(20,22,26,.08)" />
                          <Box as="div" style="position:absolute;left:10px;right:10px;top:46px;background:#fff;border:1px solid rgba(20,22,26,.14);border-radius:3px;padding:11px 8px;text-align:center">
                            <Box as="div" style="font:700 10px 'Manrope',sans-serif;letter-spacing:.12em;color:#14161A">{product.name}</Box>
                            <Box as="div" style="width:34px;height:1px;background:rgba(20,22,26,.18);margin:6px auto" />
                            <Box as="div" style="font:500 6.5px 'Space Mono',monospace;letter-spacing:.08em;color:#96702E">{product.mg} · LYOPHILIZED</Box>
                            <Box as="div" style="font:500 6px 'Space Mono',monospace;letter-spacing:.06em;color:#6B7178;margin-top:3px">LOT {product.lot} · RUO</Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box as="div" style="width:118px;height:12px;border-radius:50%;background:rgba(20,22,26,.28);filter:blur(7px);margin:10px auto 0;animation:ngShadow 7s ease-in-out infinite" />
                    </Box>
                  </Box>

                  {/* detail */}
                  <div>
                    <Box as="div" style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                      <Box as="span" style="font:500 9px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#96702E">{product.cat}</Box>
                    </Box>
                    <Box as="h1" style="margin:0;font:300 clamp(34px,3.6vw,46px)/1.05 'Spectral',serif;letter-spacing:-.01em">{product.name}</Box>
                    <Box as="div" style="font:400 14px 'Manrope',sans-serif;color:#6B7178;margin-top:8px">{product.sub}</Box>
                    <Box as="p" style="margin:22px 0 0;max-width:460px;font:400 14.5px/1.7 'Manrope',sans-serif;color:#4E545B;text-wrap:pretty">{product.blurb} Supplied as a lyophilized powder for in-vitro and laboratory research only.</Box>
                    <Box as="div" style="margin-top:28px;border:1px solid rgba(20,22,26,.11);border-radius:14px;overflow:hidden;background:#fff">
                      {specs.map((row) => (
                        <Box key={row.k} as="div" style="display:flex;justify-content:space-between;padding:12.5px 18px;border-top:1px solid rgba(20,22,26,.07);font:500 12.5px 'Manrope',sans-serif">
                          <Box as="span" style="color:#6B7178">{row.k}</Box>
                          <Box as="span" style="font-family:'Space Mono',monospace;color:#14161A">{row.v}</Box>
                        </Box>
                      ))}
                    </Box>
                    <Box as="div" className="ng-ctarow" style="display:flex;align-items:center;gap:16px;margin-top:28px">
                      <Box as="span" onClick={addToCart} style="font:600 13px 'Manrope',sans-serif;color:#F5F3ED;background:#14161A;padding:15px 30px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#2A2E34;transform:translateY(-1px)">Add to cart</Box>
                      <Box as="span" onClick={() => router.push(`/verify?lot=${product.lot}`)} style="font:600 13px 'Manrope',sans-serif;color:#96702E;cursor:pointer;border-bottom:1px solid transparent;transition:border-color .2s ease" hover="border-color:rgba(150,112,46,.5)">Verify this lot's COA →</Box>
                    </Box>
                    <Box as="p" style="margin:22px 0 0;font:400 10.5px/1.6 'Space Mono',monospace;color:#8A8F95">For Research Use Only. Not a drug, cosmetic, or food. Not for human or animal consumption.</Box>
                  </div>

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
