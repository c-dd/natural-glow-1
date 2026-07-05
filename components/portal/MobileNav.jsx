'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';
import { Cart, ChevR } from './icons';

const DrawerRow = ({ label, onClick }) => (
  <Box onClick={onClick} style="display:flex;align-items:center;justify-content:space-between;padding:13px 22px;border-bottom:1px solid rgba(20,22,26,.07);cursor:pointer" active="background:#EDE9DF">
    <span style={{ font: "600 15px 'Manrope',sans-serif", color: '#14161A' }}>{label}</span>
    <ChevR s={14} c="#C9A15E" w={1.6} />
  </Box>
);

export default function MobileNav() {
  const v = usePortal();
  const customer = v.viewAs === 'customer';
  return (
    <div className="ng-dash-mtop" style={{ display: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#14161A', padding: '12px 16px' }}>
        <div onClick={v.goHome} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <img src="/ng-mark-dark.png" alt="Natural Glow" style={{ width: 92, height: 'auto', display: 'block' }} />
          <span style={{ font: "500 6.5px 'Space Mono',monospace", letterSpacing: '.1em', color: '#C9A15E', border: '1px solid rgba(201,161,94,.5)', padding: '2px 4px', borderRadius: 3 }}>RUO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: 2 }}>
            <span onClick={v.setCustomer} style={{ font: "600 9.5px 'Manrope',sans-serif", padding: '5px 10px', borderRadius: 999, cursor: 'pointer', background: customer ? '#F5F3ED' : 'transparent', color: customer ? '#14161A' : '#A7ADB3' }}>Customer</span>
            <span onClick={v.setAdmin} style={{ font: "600 9.5px 'Manrope',sans-serif", padding: '5px 10px', borderRadius: 999, cursor: 'pointer', background: customer ? 'transparent' : '#F5F3ED', color: customer ? '#A7ADB3' : '#14161A' }}>Admin</span>
          </div>
          {customer && (
            <span onClick={v.openCart} style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 34, height: 34, cursor: 'pointer' }}>
              <Cart s={17} c="#F5F3ED" w={1.7} />
              {v.cartHasItems && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', display: 'grid', placeItems: 'center', background: '#C9A15E', color: '#14161A', font: "700 9px 'Space Mono',monospace", borderRadius: 999 }}>{v.cartCount}</span>
              )}
            </span>
          )}
          <span onClick={v.toggleDashNav} style={{ position: 'relative', width: 22, height: 14, display: 'block', cursor: 'pointer' }}>
            <Box as="span" style={v.dbarTop} />
            <Box as="span" style={v.dbarBot} />
          </span>
        </div>
      </div>

      {/* horizontal tab strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, background: '#F5F3ED', borderBottom: '1px solid rgba(20,22,26,.1)', padding: '0 20px' }}>
        {customer ? (
          <>
            <Box as="span" onClick={v.goCustCatalog} style={v.mtabCatalog}>Catalog</Box>
            <Box as="span" onClick={v.goCustOrders} style={v.mtabOrders}>My orders</Box>
            <Box as="span" onClick={v.goAccount} style={v.mtabAccount}>Account</Box>
          </>
        ) : (
          <>
            <Box as="span" onClick={v.goAdmOrders} style={v.mtabAdmOrders}>Orders</Box>
            <Box as="span" onClick={v.goAdmInventory} style={v.mtabAdmInventory}>Inventory</Box>
          </>
        )}
      </div>

      {/* hamburger drawer */}
      {v.dashNav && v.isMobile && (
        <>
          <div onClick={v.closeDashNav} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(20,22,26,.4)', animation: 'ngMenuFade .25s ease' }} />
          <div style={{ position: 'fixed', top: 68, left: 14, right: 14, zIndex: 81, borderRadius: 16, background: '#F5F3ED', boxShadow: '0 24px 54px rgba(20,22,26,.35)', overflow: 'hidden', animation: 'ngMenuSheet .28s cubic-bezier(.2,.9,.3,1)' }}>
            <div style={{ font: "500 8.5px 'Space Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#96702E', padding: '16px 22px 6px' }}>Customer</div>
            <DrawerRow label="Catalog" onClick={v.drawerCustCatalog} />
            <DrawerRow label="My orders" onClick={v.drawerCustOrders} />
            <DrawerRow label="Account" onClick={v.drawerAccount} />
            <div style={{ font: "500 8.5px 'Space Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#96702E', padding: '14px 22px 6px' }}>Admin</div>
            <DrawerRow label="Orders" onClick={v.drawerAdmOrders} />
            <DrawerRow label="Inventory" onClick={v.drawerAdmInventory} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', background: '#EDE9DF' }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: '#C9A15E', color: '#14161A', font: "700 12px 'Manrope',sans-serif" }}>{v.authInitial}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 12.5px 'Manrope',sans-serif", color: '#14161A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.authName}</div>
                <div onClick={v.logout} style={{ font: "500 11px 'Manrope',sans-serif", color: '#96702E', cursor: 'pointer' }}>Log out</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
