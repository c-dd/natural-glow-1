'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';
import { Field } from './Field';
import { Cart, ChevR, ChevL, Search } from './icons';

// =================== CATALOG ===================
export function CatalogView() {
  const v = usePortal();
  return (
    <div className="ng-dashpad" style={{ padding: '44px 48px', maxWidth: 1060, animation: 'ngRise .45s cubic-bezier(.2,.7,.2,1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div>
          <div style={{ font: "500 10px 'Space Mono',monospace", letterSpacing: '.22em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 10 }}>Your catalog</div>
          <h1 style={{ margin: 0, font: "300 clamp(28px,3vw,40px)/1.05 'Spectral',serif" }}>Welcome, {v.authName}.</h1>
          <p style={{ margin: '12px 0 0', font: "400 13.5px/1.65 'Manrope',sans-serif", color: '#4A5540' }}>Browse research-grade peptides and add them to your cart. Search by name, sequence, CAS, or lot.</p>
        </div>
        <Box className="ng-contentcart" onClick={v.openCart} style="position:relative;flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#fff;border:1px solid rgba(45,53,39,.13);cursor:pointer;transition:all .2s ease" hover="border-color:rgba(90,107,75,.5);transform:translateY(-1px)">
          <Cart s={18} c="#2E3627" w={1.7} />
          {v.cartHasItems && (
            <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 17, height: 17, padding: '0 4px', display: 'grid', placeItems: 'center', background: '#FFDFE0', color: '#B96F74', font: "700 9px 'Space Mono',monospace", borderRadius: 999 }}>{v.cartCount}</span>
          )}
        </Box>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '26px 0 18px', maxWidth: 480, background: '#fff', border: '1.5px solid rgba(45,53,39,.13)', borderRadius: 11, padding: '12px 15px' }}>
        <Search s={15} c="#99A18C" w={1.8} />
        <input value={v.dashSearch} onChange={v.onDashSearch} placeholder="Search compounds…" style={{ flex: 1, border: 'none', background: 'transparent', font: "500 14px 'Manrope',sans-serif", color: '#2E3627' }} />
        <span style={{ font: "500 10px 'Space Mono',monospace", color: '#99A18C' }}>{v.dashCount}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {v.dashList.map((p) => (
          <Box key={p.id} className="ng-dashrow" style="background:#fff;border:1px solid rgba(45,53,39,.1);border-radius:13px;display:flex;align-items:center;gap:16px;padding:16px 20px;transition:border-color .25s ease, box-shadow .25s ease" hover="border-color:rgba(90,107,75,.4);box-shadow:0 12px 30px -22px rgba(45,53,39,.35)">
            <div className="ng-dashrow-badge" style={{ flex: 'none', width: 42, height: 42, borderRadius: 10, background: '#FFF1F1', display: 'grid', placeItems: 'center', font: "700 12px 'Space Mono',monospace", color: '#5A6B4B' }}>{p.badge}</div>
            <div className="ng-dashrow-main" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}><span style={{ font: "600 15px 'Manrope',sans-serif" }}>{p.name}</span></div>
              <div style={{ font: "400 12px 'Manrope',sans-serif", color: '#78826B', marginTop: 3 }}>{p.sub} · {p.mg} · Lot {p.lot} · <span onClick={p.viewCoa} style={{ color: '#5A6B4B', cursor: 'pointer' }}>COA</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 'none' }}><Box as="span" style={p.stockDotStyle} /><span style={{ font: "500 10.5px 'Manrope',sans-serif", color: '#78826B' }}>{p.stockLabel}</span></div>
            <span style={{ flex: 'none', font: "600 19px 'Spectral',serif", width: 58, textAlign: 'right' }}>{p.price}</span>
            <Box as="span" onClick={p.addItem} className="ng-dashrow-add" style={p.addStyle} hover="transform:translateY(-1px)">{p.addLabel}</Box>
          </Box>
        ))}
        {v.dashEmpty && <div style={{ textAlign: 'center', padding: 44, font: "400 13px 'Manrope',sans-serif", color: '#99A18C' }}>No compounds match “{v.dashSearch}”.</div>}
      </div>
    </div>
  );
}

// =================== MY ORDERS ===================
export function MyOrdersView() {
  const v = usePortal();
  return (
    <div className="ng-dashpad" style={{ padding: '44px 48px', maxWidth: 1060, animation: 'ngRise .45s cubic-bezier(.2,.7,.2,1)' }}>
      <div style={{ font: "500 10px 'Space Mono',monospace", letterSpacing: '.22em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 10 }}>Order history</div>
      <h1 style={{ margin: 0, font: "300 clamp(28px,3vw,40px)/1.05 'Spectral',serif" }}>My orders</h1>
      <p style={{ margin: '12px 0 26px', font: "400 13.5px/1.65 'Manrope',sans-serif", color: '#4A5540' }}>Track active orders and review previous ones.</p>

      {/* MOBILE grouped list */}
      <div className="ng-orders-mobile" style={{ display: 'none' }}>
        {v.myOrderGroups.map((g) => (
          <div key={g.label}>
            <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#5A6B4B', margin: '0 0 8px' }}>{g.label}</div>
            <div style={{ background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 13, overflow: 'hidden', marginBottom: 18 }}>
              {g.rows.map((o) => (
                <Box key={o.id} onClick={o.open} style={o.rowStyle} active="background:#FFF1F1">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "600 13px 'Space Mono',monospace", color: '#2E3627' }}>{o.id} <span style={{ font: "400 11px 'Manrope',sans-serif", color: '#99A18C' }}>· {o.dateShort}</span></div>
                    <Box as="div" style={o.statusStyle}>{o.statusLine}</Box>
                  </div>
                  <span style={{ font: "600 14px 'Space Mono',monospace", color: '#2E3627' }}>{o.totalStr}</span>
                  <ChevR s={14} c="#B96F74" w={1.7} />
                </Box>
              ))}
            </div>
          </div>
        ))}
        {v.myOrdersEmpty && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 13 }}>
            <div style={{ font: "600 14px 'Manrope',sans-serif", color: '#2E3627' }}>No orders yet</div>
            <div style={{ font: "400 12px 'Manrope',sans-serif", color: '#99A18C', marginTop: 5 }}>Compounds you order will appear here.</div>
            <div onClick={v.goCustCatalog} style={{ font: "600 12px 'Manrope',sans-serif", color: '#5A6B4B', marginTop: 12, cursor: 'pointer' }}>Browse the catalog →</div>
          </div>
        )}
      </div>

      {/* DESKTOP cards */}
      <div className="ng-orders-desk" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {v.myOrders.map((o) => (
          <Box key={o.id} onClick={o.openDetail} style="background:#fff;border:1px solid rgba(45,53,39,.1);border-radius:14px;overflow:hidden;cursor:pointer;transition:border-color .2s ease, box-shadow .2s ease" hover="border-color:rgba(90,107,75,.45);box-shadow:0 12px 30px -22px rgba(45,53,39,.3)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 22px', borderBottom: '1px solid rgba(45,53,39,.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ font: "600 13px 'Space Mono',monospace" }}>{o.id}</span>
                <span style={{ font: "400 12px 'Manrope',sans-serif", color: '#99A18C' }}>{o.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Box as="span" style={o.pillStyle}>{o.custStatus}</Box>
                <span style={{ font: "600 12px 'Manrope',sans-serif", color: '#5A6B4B' }}>View →</span>
              </div>
            </div>
            {o.isCancelled && (
              <div style={{ margin: '0 22px 6px', background: 'rgba(168,68,46,.06)', border: '1px solid rgba(168,68,46,.28)', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ font: "600 10px 'Space Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#A8442E' }}>Cancelled — {o.cancelReason}</div>
                {o.hasCancelMsg && <div style={{ font: "400 12px/1.6 'Manrope',sans-serif", color: '#7A3A2A', marginTop: 5 }}>“{o.cancelMsg}”</div>}
              </div>
            )}
            <div className="ng-ordergrid" style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 26, padding: '18px 22px' }}>
              <div>
                {o.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', font: "500 13px 'Manrope',sans-serif", padding: '3.5px 0' }}><span style={{ color: '#2E3627' }}>{it.qty} × {it.name} <span style={{ color: '#99A18C' }}>{it.mg}</span></span><span style={{ fontFamily: "'Space Mono',monospace", color: '#4A5540' }}>{it.lineStr}</span></div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, paddingTop: 9, borderTop: '1px solid rgba(45,53,39,.09)', font: "600 14px 'Manrope',sans-serif" }}><span>Total</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{o.totalStr}</span></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Box as="span" style={o.dot1} /><Box as="span" style={o.lineA} /><Box as="span" style={o.dot2} /><Box as="span" style={o.lineB} /><Box as="span" style={o.dot3} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, font: "500 9.5px 'Space Mono',monospace", letterSpacing: '.06em', textTransform: 'uppercase', color: '#99A18C' }}>
                  <span>Placed</span><span>Processing</span><span>Shipped</span>
                </div>
              </div>
            </div>
          </Box>
        ))}
        {v.myOrdersEmpty && (
          <div style={{ textAlign: 'center', padding: 50, background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 14 }}>
            <div style={{ font: "600 15px 'Manrope',sans-serif", color: '#2E3627' }}>No orders yet</div>
            <div style={{ font: "400 12.5px 'Manrope',sans-serif", color: '#99A18C', marginTop: 6 }}>Compounds you order will appear here with live status.</div>
            <span onClick={v.goCustCatalog} style={{ display: 'inline-block', marginTop: 16, font: "600 12px 'Manrope',sans-serif", color: '#5A6B4B', cursor: 'pointer' }}>Browse the catalog →</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== ORDER DETAIL ===================
export function OrderDetailView() {
  const v = usePortal();
  const o = v.detailOrder;
  return (
    <div className="ng-dashpad" style={{ padding: '44px 48px', maxWidth: 640, animation: 'ngRise .45s cubic-bezier(.2,.7,.2,1)' }}>
      <div onClick={v.backToOrders} style={{ display: 'flex', alignItems: 'center', gap: 6, font: "600 12px 'Manrope',sans-serif", color: '#5A6B4B', cursor: 'pointer' }}>
        <ChevL s={14} c="#5A6B4B" w={1.8} />
        My orders
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, font: "300 24px 'Spectral',serif", color: '#2E3627' }}>Order <span style={{ font: "600 19px 'Space Mono',monospace" }}>{o.id}</span></h1>
        <Box as="span" style={o.pillStyle}>{o.statusLabel}</Box>
      </div>
      <div style={{ font: "400 11.5px 'Manrope',sans-serif", color: '#99A18C', marginTop: 4 }}>Placed {o.dateLong}</div>

      <div style={{ background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 13, padding: '18px 16px', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Box as="span" style={o.dot1} /><Box as="span" style={o.lineA} /><Box as="span" style={o.dot2} /><Box as="span" style={o.lineB} /><Box as="span" style={o.dot3} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Box as="span" style={o.lbl1}>Placed</Box>
          <Box as="span" style={o.lbl2}>Processing</Box>
          <Box as="span" style={o.lbl3}>Shipped</Box>
        </div>
      </div>

      {o.isCancelled && (
        <div style={{ background: 'rgba(168,68,46,.06)', border: '1px solid rgba(168,68,46,.3)', borderRadius: 13, padding: 16, marginTop: 12 }}>
          <div style={{ font: "600 10px 'Space Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#A8442E' }}>Cancelled — {o.cancelReason}</div>
          {o.hasCancelMsg && <div style={{ font: "400 12.5px/1.65 'Manrope',sans-serif", color: '#7A3A2A', marginTop: 6 }}>“{o.cancelMsg}”</div>}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 13, padding: 16, marginTop: 12 }}>
        <div style={{ font: "500 8.5px 'Space Mono',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 10 }}>{o.itemsLabel}</div>
        {(o.items || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '5px 0' }}>
            <span style={{ font: "500 13px 'Manrope',sans-serif", color: '#2E3627' }}>{it.qty} × {it.name} <span style={{ color: '#99A18C' }}>{it.mg}</span>{it.hasCoa && <> · <span onClick={it.viewCoa} style={{ color: '#5A6B4B', cursor: 'pointer' }}>COA</span></>}</span>
            <span style={{ font: "500 12.5px 'Space Mono',monospace", color: '#4A5540', whiteSpace: 'nowrap' }}>{it.lineStr}</span>
          </div>
        ))}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(45,53,39,.09)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12.5px 'Manrope',sans-serif", color: '#4A5540' }}><span>Subtotal</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{o.subtotalStr}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12.5px 'Manrope',sans-serif", color: '#4A5540' }}><span>Shipping <span style={{ color: '#99A18C' }}>· cold pack</span></span><span style={{ fontFamily: "'Space Mono',monospace" }}>$0.00</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12.5px 'Manrope',sans-serif", color: '#4A5540' }}><span>Tax <span style={{ color: '#99A18C' }}>· exempt · research</span></span><span style={{ fontFamily: "'Space Mono',monospace" }}>$0.00</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, paddingTop: 8, borderTop: '1px solid rgba(45,53,39,.09)', font: "600 14px 'Manrope',sans-serif" }}><span>Total</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{o.totalStr}</span></div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 13, padding: 16, marginTop: 12 }}>
        <div style={{ font: "500 8.5px 'Space Mono',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 8 }}>Ship to</div>
        <div style={{ font: "600 13px 'Manrope',sans-serif", color: '#2E3627' }}>{o.name}</div>
        <div style={{ font: "400 12px/1.6 'Manrope',sans-serif", color: '#4A5540', whiteSpace: 'pre-line', marginTop: 3 }}>{o.address}</div>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 13, padding: 16, marginTop: 12 }}>
        <div style={{ font: "500 8.5px 'Space Mono',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 10 }}>Shipment</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', font: "500 12.5px 'Manrope',sans-serif" }}><span style={{ color: '#99A18C' }}>Method</span><span style={{ color: '#2E3627', textAlign: 'right' }}>{o.method}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', font: "500 12.5px 'Manrope',sans-serif" }}><span style={{ color: '#99A18C' }}>Carrier</span><span style={{ color: '#2E3627', textAlign: 'right' }}>{o.carrier}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', font: "500 12.5px 'Manrope',sans-serif" }}><span style={{ color: '#99A18C' }}>Tracking</span><span style={{ fontFamily: "'Space Mono',monospace", color: '#2E3627', textAlign: 'right' }}>{o.tracking}</span></div>
      </div>

      <div onClick={v.goContact} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#FFF1F1', border: '1px solid rgba(45,53,39,.09)', borderRadius: 12, padding: '13px 14px', marginTop: 12, cursor: 'pointer' }}>
        <span style={{ font: "500 11.5px 'Manrope',sans-serif", color: '#4A5540' }}>Need a change to this order?</span>
        <span style={{ font: "600 11.5px 'Manrope',sans-serif", color: '#5A6B4B', whiteSpace: 'nowrap' }}>Contact us →</span>
      </div>
    </div>
  );
}

// =================== ACCOUNT ===================
export function AccountView() {
  const v = usePortal();
  const CARD = { background: '#fff', border: '1px solid rgba(45,53,39,.1)', borderRadius: 14, padding: '24px 24px 26px', marginBottom: 16 };
  const SECT = { font: "500 9px 'Space Mono',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 16 };
  return (
    <div className="ng-dashpad" style={{ padding: '44px 48px', maxWidth: 720, animation: 'ngRise .45s cubic-bezier(.2,.7,.2,1)' }}>
      <div style={{ font: "500 10px 'Space Mono',monospace", letterSpacing: '.22em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 10 }}>Your account</div>
      <h1 style={{ margin: 0, font: "300 clamp(28px,3vw,40px)/1.05 'Spectral',serif" }}>Account</h1>
      <p style={{ margin: '12px 0 28px', font: "400 13.5px/1.65 'Manrope',sans-serif", color: '#4A5540' }}>Manage your profile, shipping address, and password. Details are saved to this browser for the demo.</p>

      <div style={CARD}>
        <div style={SECT}>Profile</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Name" value={v.acctName} onChange={v.onAcctName} placeholder="Dr. Jane Okafor" />
          <Field label="Email" value={v.acctEmail} onChange={v.onAcctEmail} placeholder="jane@lab.edu" />
          <Field label="Organization / Lab" value={v.acctOrg} onChange={v.onAcctOrg} placeholder="Okafor Lab" />
        </div>
      </div>

      <div style={CARD}>
        <div style={SECT}>Shipping address</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Address" value={v.acctAddr} onChange={v.onAcctAddr} placeholder="4180 Calle Real, Suite 210" />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field wrapStyle={{ flex: 1.4 }} label="City" value={v.acctCity} onChange={v.onAcctCity} placeholder="Santa Barbara" />
            <Field wrapStyle={{ flex: 0.7 }} label="State" value={v.acctState} onChange={v.onAcctState} placeholder="CA" />
            <Field wrapStyle={{ flex: 0.9 }} label="ZIP" value={v.acctZip} onChange={v.onAcctZip} placeholder="93110" />
          </div>
          <Field label="Country" value={v.acctCountry} onChange={v.onAcctCountry} placeholder="United States" />
        </div>
      </div>

      <div style={{ ...CARD, marginBottom: 20 }}>
        <div style={SECT}>Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Current password" type="password" value={v.acctPwCur} onChange={v.onAcctPwCur} placeholder="••••••••" />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field wrapStyle={{ flex: 1 }} label="New password" type="password" value={v.acctPwNew} onChange={v.onAcctPwNew} placeholder="••••••••" />
            <Field wrapStyle={{ flex: 1 }} label="Confirm" type="password" value={v.acctPwConf} onChange={v.onAcctPwConf} placeholder="••••••••" />
          </div>
          <div onClick={v.forgotPw} style={{ font: "600 11.5px 'Manrope',sans-serif", color: '#5A6B4B', cursor: 'pointer' }}>Forgot password?</div>
        </div>
        <p style={{ margin: '14px 0 0', font: "400 10px/1.6 'Space Mono',monospace", color: '#99A18C' }}>Password fields are decorative in this demo and are never stored.</p>
      </div>

      <Box as="span" onClick={v.saveAccount} style="display:block;text-align:center;font:600 13px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:15px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76;transform:translateY(-1px)">Save changes</Box>
    </div>
  );
}
