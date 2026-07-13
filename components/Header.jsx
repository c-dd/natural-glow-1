'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/Box';
import { toast } from '@/components/Toast';
import { useAuth, useAccount, initials, useMobile } from '@/lib/store';

// Marketing header, ported 1:1 from the original single-file app.
// `active` highlights the matching nav item ('catalog' | 'science' | 'verify'
// | 'contact'); the product route passes active='catalog' (as in the source).

const navStyle = (a) =>
  "font:600 12px 'Manrope',sans-serif;cursor:pointer;color:" +
  (a ? '#2E3627' : '#6E7A64') +
  ';border-bottom:1.5px solid ' +
  (a ? '#5A6B4B' : 'transparent') +
  ';padding-bottom:2px;transition:color .2s ease;';

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E3627" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.4"></circle>
    <circle cx="18" cy="20" r="1.4"></circle>
    <path d="M2 3h2.2l2.1 12.3a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.3L21 7H5.2"></path>
  </svg>
);

const Chevron = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B96F74" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
);

export default function Header({ active = '' }) {
  const router = useRouter();
  const signedIn = useAuth();
  const account = useAccount();
  const mobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (path) => { setMenuOpen(false); router.push(path); };
  const headerCart = () => {
    if (signedIn) { router.push('/dashboard?view=catalog'); }
    else { router.push('/signin'); toast('Sign in to build your order'); }
  };

  const barBase = 'position:absolute;left:0;width:22px;height:1.6px;background:#2E3627;border-radius:1px;transition:transform .3s ease, top .3s ease;';
  const hbarTop = barBase + (menuOpen ? 'top:6px;transform:rotate(45deg);' : 'top:3px;');
  const hbarBot = barBase + (menuOpen ? 'top:6px;transform:rotate(-45deg);' : 'top:10px;');

  return (
    <div style={{ position: 'relative', zIndex: 20 }}>
      {/* top RUO strip */}
      <Box as="div" style="padding:7px 5vw;background:#9EAF8B">
        <Box as="div" style="display:flex;justify-content:space-between;align-items:center;max-width:900px;margin:0 auto">
          <Box as="span" style="font:500 8.5px 'Space Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.75)">For Research Use Only</Box>
          <Box as="span" style="font:500 8.5px 'Space Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.75)">COA on every lot</Box>
        </Box>
      </Box>

      {/* logo + nav */}
      <Box as="div" style="padding:4px 5vw;background:#FFDFE0">
        <Box as="div" style="display:flex;justify-content:space-between;align-items:center;max-width:900px;margin:0 auto">
          <Box as="div" onClick={() => go('/')} style="display:flex;align-items:center;gap:9px;cursor:pointer">
            <img src="/ng-mark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
            <Box as="span" style="font:500 8px 'Space Mono',monospace;letter-spacing:.1em;color:#5A6B4B;border:1px solid rgba(90,107,75,.45);padding:2px 5px;border-radius:3px">RUO</Box>
          </Box>
          <Box as="div" className="ng-headrow" style="display:flex;align-items:center;gap:28px">
            <Box as="div" className="ng-navlinks" style="display:flex;align-items:center;gap:28px">
              <Box as="span" onClick={() => go('/catalog')} style={navStyle(active === 'catalog')} hover="color:#2E3627">Catalog</Box>
              <Box as="span" onClick={() => go('/science')} style={navStyle(active === 'science')} hover="color:#2E3627">Science</Box>
              <Box as="span" onClick={() => go('/verify')} style={navStyle(active === 'verify')} hover="color:#2E3627">Verify COA</Box>
              <Box as="span" onClick={() => go('/contact')} style={navStyle(active === 'contact')} hover="color:#2E3627">Contact</Box>
            </Box>
            <Box as="div" className="ng-navcart" onClick={headerCart} style="display:grid;place-items:center;width:36px;height:36px;border-radius:10px;border:1px solid rgba(45,53,39,.14);cursor:pointer" title="Cart">
              <CartIcon />
            </Box>
            {!signedIn && (
              <Box as="span" onClick={() => go('/signin')} style="font:600 11.5px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:11px 20px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76;transform:translateY(-1px)">Sign in</Box>
            )}
            {signedIn && (
              <Box as="span" onClick={() => go('/dashboard')} style="display:flex;align-items:center;gap:8px;font:600 11.5px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:7px 8px 7px 18px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">Dashboard <Box as="span" style="display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:#FFDFE0;color:#B96F74;font:700 10px 'Manrope',sans-serif">{initials(account.name)}</Box></Box>
            )}
            <Box as="span" className="ng-hamburger" onClick={() => setMenuOpen((o) => !o)} style="display:none;width:22px;height:14px;position:relative;cursor:pointer;margin:0 2px">
              <Box as="span" style={hbarTop} />
              <Box as="span" style={hbarBot} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* mobile nav sheet */}
      {mobile && menuOpen && (
        <>
          <Box as="div" onClick={() => setMenuOpen(false)} style="position:fixed;inset:0;z-index:80;background:rgba(45,53,39,.34);animation:ngMenuFade .25s ease" />
          <Box as="div" style="position:fixed;top:96px;left:16px;right:16px;z-index:81;border-radius:16px;background:#FFDFE0;box-shadow:0 24px 54px rgba(45,53,39,.3);overflow:hidden;animation:ngMenuSheet .28s cubic-bezier(.2,.9,.3,1)">
            <Box as="div" onClick={() => go('/catalog')} style="display:flex;align-items:center;justify-content:space-between;padding:17px 22px;border-bottom:1px solid rgba(45,53,39,.07);cursor:pointer" active="background:#FFF1F1">
              <Box as="span" style="font:500 16px 'Manrope',sans-serif;color:#2E3627">Catalog</Box>
              <Chevron />
            </Box>
            <Box as="div" onClick={() => go('/science')} style="display:flex;align-items:center;justify-content:space-between;padding:17px 22px;border-bottom:1px solid rgba(45,53,39,.07);cursor:pointer" active="background:#FFF1F1">
              <Box as="span" style="font:500 16px 'Manrope',sans-serif;color:#2E3627">Science</Box>
              <Chevron />
            </Box>
            <Box as="div" onClick={() => go('/verify')} style="display:flex;align-items:center;justify-content:space-between;padding:17px 22px;border-bottom:1px solid rgba(45,53,39,.07);cursor:pointer" active="background:#FFF1F1">
              <Box as="span" style="font:500 16px 'Manrope',sans-serif;color:#2E3627">Verify COA</Box>
              <Chevron />
            </Box>
            <Box as="div" onClick={() => go('/contact')} style="display:flex;align-items:center;justify-content:space-between;padding:17px 22px;border-bottom:1px solid rgba(45,53,39,.07);cursor:pointer" active="background:#FFF1F1">
              <Box as="span" style="font:500 16px 'Manrope',sans-serif;color:#2E3627">Contact</Box>
              <Chevron />
            </Box>
            {!signedIn && (
              <Box as="div" onClick={() => go('/signin')} style="display:flex;align-items:center;justify-content:space-between;padding:17px 22px;cursor:pointer" active="background:#FFF1F1">
                <Box as="span" style="font:600 16px 'Manrope',sans-serif;color:#5A6B4B">Sign in</Box>
                <Chevron />
              </Box>
            )}
            {signedIn && (
              <Box as="div" onClick={() => go('/dashboard')} style="display:flex;align-items:center;justify-content:space-between;padding:17px 22px;cursor:pointer" active="background:#FFF1F1">
                <Box as="span" style="font:600 16px 'Manrope',sans-serif;color:#5A6B4B">Dashboard</Box>
                <Chevron />
              </Box>
            )}
          </Box>
        </>
      )}
    </div>
  );
}
