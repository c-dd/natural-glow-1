'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';
import { Cart, ChevR } from './icons';

const DrawerRow = ({ label, onClick }) => (
  <Box onClick={onClick} style="display:flex;align-items:center;justify-content:space-between;padding:13px 22px;border-bottom:1px solid rgba(45,53,39,.07);cursor:pointer" active="background:#FFF1F1">
    <span style={{ font: "600 15px 'Manrope',sans-serif", color: '#2E3627' }}>{label}</span>
    <ChevR s={14} c="#B96F74" w={1.6} />
  </Box>
);

export default function MobileNav() {
  const v = usePortal();
  const customer = v.viewAs === 'customer';
  return (
    <div className="ng-dash-mtop" style={{ display: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#9EAF8B', padding: '12px 16px' }}>
        <div onClick={v.goHome} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <img src="/ng-mark-dark.png" alt="Natural Glow" style={{ width: 92, height: 'auto', display: 'block' }} />
          <span style={{ font: "500 6.5px 'Space Mono',monospace", letterSpacing: '.1em', color: 'rgba(255,255,255,.75)', border: '1px solid rgba(255,255,255,.5)', padding: '2px 4px', borderRadius: 3 }}>RUO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* No Customer/Admin toggle — the dashboard is role-locked. */}
          {customer && (
            <span onClick={v.openCart} style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 34, height: 34, cursor: 'pointer' }}>
              <Cart s={17} c="#FFFFFF" w={1.7} />
              {v.cartHasItems && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', display: 'grid', placeItems: 'center', background: '#FFDFE0', color: '#B96F74', font: "700 9px 'Space Mono',monospace", borderRadius: 999 }}>{v.cartCount}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, background: '#FFDFE0', borderBottom: '1px solid rgba(45,53,39,.1)', padding: '0 20px' }}>
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
            <Box as="span" onClick={v.goAccount} style={v.mtabAccount}>Account</Box>
          </>
        )}
      </div>

      {/* hamburger drawer */}
      {v.dashNav && v.isMobile && (
        <>
          <div onClick={v.closeDashNav} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(45,53,39,.4)', animation: 'ngMenuFade .25s ease' }} />
          <div style={{ position: 'fixed', top: 68, left: 14, right: 14, zIndex: 81, borderRadius: 16, background: '#FFDFE0', boxShadow: '0 24px 54px rgba(45,53,39,.35)', overflow: 'hidden', animation: 'ngMenuSheet .28s cubic-bezier(.2,.9,.3,1)' }}>
            {/* Role-locked drawer: only the current role's destinations. */}
            {customer ? (
              <>
                <DrawerRow label="Catalog" onClick={v.drawerCustCatalog} />
                <DrawerRow label="My orders" onClick={v.drawerCustOrders} />
                <DrawerRow label="Account" onClick={v.drawerAccount} />
              </>
            ) : (
              <>
                <DrawerRow label="Orders" onClick={v.drawerAdmOrders} />
                <DrawerRow label="Inventory" onClick={v.drawerAdmInventory} />
                <DrawerRow label="Account" onClick={v.drawerAccount} />
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', background: '#FFF1F1' }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: '#FFDFE0', color: '#B96F74', font: "700 12px 'Manrope',sans-serif" }}>{v.authInitial}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 12.5px 'Manrope',sans-serif", color: '#2E3627', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.authName}</div>
                <div onClick={v.logout} style={{ font: "500 11px 'Manrope',sans-serif", color: '#5A6B4B', cursor: 'pointer' }}>Log out</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
