'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';

const RUO = () => (
  <Box as="span" style="font:500 7px 'Space Mono',monospace;letter-spacing:.1em;color:#C9A15E;border:1px solid rgba(201,161,94,.5);padding:2px 4px;border-radius:3px">RUO</Box>
);

export default function Sidebar() {
  const v = usePortal();
  const customer = v.viewAs === 'customer';
  return (
    <Box className="ng-dash-side" style="background:#14161A;display:flex;flex-direction:column;padding:24px 16px 20px;position:sticky;top:0;height:100vh">
      <Box onClick={v.goHome} style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:0 8px">
        <img src="/ng-mark-dark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
        <RUO />
      </Box>

      {/* Customer | Admin segmented toggle */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 999, padding: 3, margin: '22px 8px 26px' }}>
        <span onClick={v.setCustomer} style={{ flex: 1, textAlign: 'center', font: "600 10.5px 'Manrope',sans-serif", padding: 7, borderRadius: 999, cursor: 'pointer', background: customer ? '#F5F3ED' : 'transparent', color: customer ? '#14161A' : '#A7ADB3' }}>Customer</span>
        <span onClick={v.setAdmin} style={{ flex: 1, textAlign: 'center', font: "600 10.5px 'Manrope',sans-serif", padding: 7, borderRadius: 999, cursor: 'pointer', background: customer ? 'transparent' : '#F5F3ED', color: customer ? '#A7ADB3' : '#14161A' }}>Admin</span>
      </div>

      {customer ? (
        <div className="ng-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box as="span" onClick={v.goCustCatalog} style={v.sideCustCatalog} hover="color:#F5F3ED">Catalog</Box>
          <Box as="span" onClick={v.goCustOrders} style={v.sideCustOrders} hover="color:#F5F3ED">My orders</Box>
          <Box as="span" onClick={v.goAccount} style={v.sideAccount} hover="color:#F5F3ED">Account</Box>
        </div>
      ) : (
        <div className="ng-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box as="span" onClick={v.goAdmOrders} style={v.sideAdmOrders} hover="color:#F5F3ED">Orders</Box>
          <Box as="span" onClick={v.goAdmInventory} style={v.sideAdmInventory} hover="color:#F5F3ED">Inventory</Box>
        </div>
      )}

      <div style={{ marginTop: 'auto', padding: '14px 8px 0', borderTop: '1px solid rgba(255,255,255,.09)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: '#C9A15E', color: '#14161A', font: "700 12px 'Manrope',sans-serif" }}>{v.authInitial}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 12px 'Manrope',sans-serif", color: '#F5F3ED', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.authName}</div>
            <Box onClick={v.logout} style="font:500 10.5px 'Manrope',sans-serif;color:#7E858C;cursor:pointer;transition:color .2s ease" hover="color:#C9A15E">Log out</Box>
          </div>
        </div>
      </div>
    </Box>
  );
}
