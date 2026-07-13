'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';

const RUO = () => (
  <Box as="span" style="font:500 7px 'Space Mono',monospace;letter-spacing:.1em;color:#5A6B4B;border:1px solid rgba(185,111,116,.5);padding:2px 4px;border-radius:3px">RUO</Box>
);

export default function Sidebar() {
  const v = usePortal();
  const customer = v.viewAs === 'customer';
  return (
    <Box className="ng-dash-side" style="background:#9EAF8B;display:flex;flex-direction:column;padding:24px 16px 20px;position:sticky;top:0;height:100vh">
      <Box onClick={v.goHome} style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:0 8px">
        <img src="/ng-mark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
        <RUO />
      </Box>

      {/* Customer | Admin segmented toggle */}
      <div style={{ display: 'flex', background: 'rgba(45,53,39,.07)', border: '1px solid rgba(45,53,39,.1)', borderRadius: 999, padding: 3, margin: '22px 8px 26px' }}>
        <span onClick={v.setCustomer} style={{ flex: 1, textAlign: 'center', font: "600 10.5px 'Manrope',sans-serif", padding: 7, borderRadius: 999, cursor: 'pointer', background: customer ? '#FFDFE0' : 'transparent', color: customer ? '#2E3627' : '#4A5540' }}>Customer</span>
        <span onClick={v.setAdmin} style={{ flex: 1, textAlign: 'center', font: "600 10.5px 'Manrope',sans-serif", padding: 7, borderRadius: 999, cursor: 'pointer', background: customer ? 'transparent' : '#FFDFE0', color: customer ? '#4A5540' : '#2E3627' }}>Admin</span>
      </div>

      {customer ? (
        <div className="ng-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box as="span" onClick={v.goCustCatalog} style={v.sideCustCatalog} hover="color:#2E3627">Catalog</Box>
          <Box as="span" onClick={v.goCustOrders} style={v.sideCustOrders} hover="color:#2E3627">My orders</Box>
          <Box as="span" onClick={v.goAccount} style={v.sideAccount} hover="color:#2E3627">Account</Box>
        </div>
      ) : (
        <div className="ng-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box as="span" onClick={v.goAdmOrders} style={v.sideAdmOrders} hover="color:#2E3627">Orders</Box>
          <Box as="span" onClick={v.goAdmInventory} style={v.sideAdmInventory} hover="color:#2E3627">Inventory</Box>
        </div>
      )}

      <div style={{ marginTop: 'auto', padding: '14px 8px 0', borderTop: '1px solid rgba(45,53,39,.09)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: '#FFDFE0', color: '#B96F74', font: "700 12px 'Manrope',sans-serif" }}>{v.authInitial}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 12px 'Manrope',sans-serif", color: '#2E3627', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.authName}</div>
            <Box onClick={v.logout} style="font:500 10.5px 'Manrope',sans-serif;color:#6E7A64;cursor:pointer;transition:color .2s ease" hover="color:#5A6B4B">Log out</Box>
          </div>
        </div>
      </div>
    </Box>
  );
}
