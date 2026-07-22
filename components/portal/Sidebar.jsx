'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';

const RUO = () => (
  <Box as="span" style="font:500 7px 'Space Mono',monospace;letter-spacing:.1em;color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.5);padding:2px 4px;border-radius:3px">RUO</Box>
);

export default function Sidebar() {
  const v = usePortal();
  const customer = v.viewAs === 'customer';
  return (
    <Box className="ng-dash-side" style="background:#9EAF8B;display:flex;flex-direction:column;padding:24px 16px 20px;position:sticky;top:0;height:100vh">
      <Box onClick={v.goHome} style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:0 8px">
        <img src="/ng-mark-dark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
        <RUO />
      </Box>

      {/* Role-locked nav — no Customer/Admin toggle. viewAs is derived from the
          session role: admins never see the shopping surfaces; customers never
          see admin surfaces. */}
      <div style={{ height: 26 }} />

      {customer ? (
        <div className="ng-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box as="span" onClick={v.goCustCatalog} style={v.sideCustCatalog} hover="color:#FFFFFF">Catalog</Box>
          <Box as="span" onClick={v.goCustOrders} style={v.sideCustOrders} hover="color:#FFFFFF">My orders</Box>
          <Box as="span" onClick={v.goAccount} style={v.sideAccount} hover="color:#FFFFFF">Account</Box>
        </div>
      ) : (
        <div className="ng-side-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box as="span" onClick={v.goAdmOrders} style={v.sideAdmOrders} hover="color:#FFFFFF">Orders</Box>
          <Box as="span" onClick={v.goAdmInventory} style={v.sideAdmInventory} hover="color:#FFFFFF">Inventory</Box>
          <Box as="span" onClick={v.goAccount} style={v.sideAccount} hover="color:#FFFFFF">Account</Box>
        </div>
      )}

      <div style={{ marginTop: 'auto', padding: '14px 8px 0', borderTop: '1px solid rgba(255,255,255,.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: '#FFDFE0', color: '#B96F74', font: "700 12px 'Manrope',sans-serif" }}>{v.authInitial}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 12px 'Manrope',sans-serif", color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.authName}</div>
            <Box onClick={v.logout} style="font:500 10.5px 'Manrope',sans-serif;color:rgba(255,255,255,.75);cursor:pointer;transition:color .2s ease" hover="color:#FFFFFF">Log out</Box>
          </div>
        </div>
      </div>
    </Box>
  );
}
