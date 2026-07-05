'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';
import { Search, FileIcon } from './icons';

const Stat = ({ value, label, color }) => (
  <div style={{ background: '#fff', border: '1px solid rgba(20,22,26,.1)', borderRadius: 13, padding: 20 }}>
    <div style={{ font: "600 30px 'Spectral',serif", color: color || '#14161A' }}>{value}</div>
    <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#6B7178', marginTop: 5 }}>{label}</div>
  </div>
);

// =================== ADMIN ORDERS ===================
export function AdminOrdersView() {
  const v = usePortal();
  return (
    <div className="ng-dashpad" style={{ padding: '44px 48px', maxWidth: 1060, animation: 'ngRise .45s cubic-bezier(.2,.7,.2,1)' }}>
      <div style={{ font: "500 10px 'Space Mono',monospace", letterSpacing: '.22em', textTransform: 'uppercase', color: '#96702E', marginBottom: 10 }}>Admin</div>
      <h1 style={{ margin: 0, font: "300 clamp(28px,3vw,40px)/1.05 'Spectral',serif" }}>Orders</h1>

      <div className="ng-dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, margin: '24px 0' }}>
        <Stat value={v.statOpen} label="Processing" />
        <Stat value={v.statShipped} label="Shipped" color="#3E7C5B" />
        <Stat value={v.statCancelled} label="Cancelled" color="#A8442E" />
        <Stat value={v.statRevenue} label="Revenue" color="#96702E" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {v.ordersList.map((o) => (
          <Box key={o.id} style={o.cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 22px', borderBottom: '1px solid rgba(20,22,26,.07)', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ font: "600 13px 'Space Mono',monospace" }}>{o.id}</span>
                <span style={{ font: "400 12px 'Manrope',sans-serif", color: '#8A8F95' }}>{o.date}</span>
                <Box as="span" style={o.pillStyle}>{o.status}</Box>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {o.isProcessing && <Box as="span" onClick={o.markShipped} style="font:600 11px 'Manrope',sans-serif;color:#96702E;border:1px solid rgba(150,112,46,.4);padding:8px 14px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:rgba(150,112,46,.08)">Mark shipped</Box>}
                {o.canEdit && <Box as="span" onClick={o.openEdit} style="font:600 11px 'Manrope',sans-serif;color:#4E545B;border:1px solid rgba(20,22,26,.16);padding:8px 14px;border-radius:999px;cursor:pointer;transition:border-color .2s ease" hover="border-color:rgba(20,22,26,.4)">Edit</Box>}
                {o.showCancel && <Box as="span" onClick={o.askCancel} style="font:600 11px 'Manrope',sans-serif;color:#A8442E;border:1px solid rgba(168,68,46,.35);padding:8px 14px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:rgba(168,68,46,.08)">Cancel</Box>}
              </div>
            </div>
            <div className="ng-ordergrid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 26, padding: '18px 22px' }}>
              <div>
                <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#96702E', marginBottom: 9 }}>Ship to</div>
                <div style={{ font: "600 15px 'Manrope',sans-serif", color: '#14161A' }}>{o.name}</div>
                <div style={{ font: "400 13px/1.65 'Manrope',sans-serif", color: '#4E545B', whiteSpace: 'pre-line', marginTop: 5 }}>{o.address}</div>
              </div>
              <div>
                <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#96702E', marginBottom: 9 }}>Included</div>
                {o.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', font: "500 13px 'Manrope',sans-serif", padding: '3.5px 0' }}><span style={{ color: '#14161A' }}>{it.qty} × {it.name} <span style={{ color: '#8A8F95' }}>{it.mg}</span></span><span style={{ fontFamily: "'Space Mono',monospace", color: '#4E545B' }}>{it.lineStr}</span></div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, paddingTop: 9, borderTop: '1px solid rgba(20,22,26,.09)', font: "600 14px 'Manrope',sans-serif" }}><span>Total</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{o.totalStr}</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 22px', borderTop: '1px solid rgba(20,22,26,.07)', background: '#FAF8F3' }}>
              <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#96702E' }}>Proof of payment</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <FileIcon s={14} c="#4E545B" w={1.7} />
                <span style={{ font: "500 12px 'Manrope',sans-serif", color: '#14161A' }}>{o.proof}</span>
                <span onClick={o.viewProof} style={{ font: "600 11px 'Manrope',sans-serif", color: '#96702E', cursor: 'pointer' }}>View</span>
              </div>
            </div>
          </Box>
        ))}
      </div>
    </div>
  );
}

// =================== ADMIN INVENTORY ===================
export function InventoryView() {
  const v = usePortal();
  return (
    <div className="ng-dashpad" style={{ padding: '44px 48px', maxWidth: 1060, animation: 'ngRise .45s cubic-bezier(.2,.7,.2,1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ font: "500 10px 'Space Mono',monospace", letterSpacing: '.22em', textTransform: 'uppercase', color: '#96702E', marginBottom: 10 }}>Admin</div>
          <h1 style={{ margin: 0, font: "300 clamp(28px,3vw,40px)/1.05 'Spectral',serif" }}>Inventory</h1>
        </div>
        <Box as="span" onClick={v.openNewPeptide} style="font:600 12.5px 'Manrope',sans-serif;color:#F5F3ED;background:#14161A;padding:13px 24px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#2A2E34;transform:translateY(-1px)">+ New peptide</Box>
      </div>

      <div className="ng-dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, margin: '24px 0' }}>
        <Stat value={v.statSkus} label="Active SKUs" />
        <Stat value={v.totalUnits} label="Units in stock" />
        <Stat value={v.lowCount} label="Low stock" color="#B07A24" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, maxWidth: 460, background: '#fff', border: '1.5px solid rgba(20,22,26,.13)', borderRadius: 11, padding: '12px 15px' }}>
        <Search s={15} c="#8A8F95" w={1.8} />
        <input value={v.dashSearch} onChange={v.onDashSearch} placeholder="Search compounds or lots…" style={{ flex: 1, border: 'none', background: 'transparent', font: "500 14px 'Manrope',sans-serif", color: '#14161A' }} />
      </div>

      <div className="ng-invscroll" style={{ background: '#fff', border: '1px solid rgba(20,22,26,.1)', borderRadius: 14, overflow: 'hidden' }}>
        <div className="ng-invrow" style={{ display: 'grid', gridTemplateColumns: '1.7fr .9fr .7fr .8fr 1.1fr', padding: '13px 20px', background: '#F5F3ED', font: "500 9px 'Space Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#6B7178' }}>
          <span>Compound</span><span>Category</span><span>Price</span><span>Lot</span><span style={{ textAlign: 'right' }}>Stock</span>
        </div>
        {v.invList.map((p) => (
          <Box key={p.id} className="ng-invrow" style="display:grid;grid-template-columns:1.7fr .9fr .7fr .8fr 1.1fr;align-items:center;padding:13px 20px;border-top:1px solid rgba(20,22,26,.07);font:500 13px 'Manrope',sans-serif;transition:background .2s ease" hover="background:#FAF8F3">
            <span><span style={{ fontWeight: 600 }}>{p.name}</span> <span style={{ color: '#8A8F95', fontSize: 11 }}>{p.mg}</span></span>
            <span style={{ font: "500 10.5px 'Manrope',sans-serif", color: '#6B7178' }}>{p.cat}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", color: '#4E545B' }}>{p.price}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", color: '#4E545B' }}>{p.lot}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              <Box as="span" style={p.stockStyle}>{p.stock}</Box>
              <Box as="span" onClick={p.edit} style="font:600 11px 'Manrope',sans-serif;color:#14161A;background:#fff;border:1px solid rgba(20,22,26,.16);padding:7px 15px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="border-color:rgba(20,22,26,.4);background:#FAF8F3">Edit</Box>
            </div>
          </Box>
        ))}
        {v.dashEmpty && <div style={{ textAlign: 'center', padding: 34, font: "400 13px 'Manrope',sans-serif", color: '#8A8F95' }}>No results.</div>}
      </div>
      <p style={{ margin: '14px 0 0', font: "400 10.5px 'Space Mono',monospace", color: '#8A8F95' }}>Use Edit to set exact stock or update a lot. Cancelled orders restock automatically.</p>
    </div>
  );
}
