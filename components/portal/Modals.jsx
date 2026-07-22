'use client';

import { Box } from '@/components/Box';
import { usePortal } from './PortalContext';
import { Field, Area } from './Field';
import { Upload, FileIcon } from './icons';
import { BANK_DETAILS } from '@/lib/bankDetails';

const OVERLAY = 'position:fixed;inset:0;background:rgba(45,53,39,.48);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:ngFade .3s ease';
const SHEET = 'width:464px;max-width:100%;max-height:88vh;overflow:auto;background:#FFFFFF;border:1px solid rgba(45,53,39,.13);border-radius:18px;box-shadow:0 44px 90px -30px rgba(45,53,39,.65);animation:ngPop .4s cubic-bezier(.2,.7,.2,1)';
const HEADCLOSE = "cursor:pointer;font:400 20px 'Manrope',sans-serif;color:#99A18C;line-height:1;transition:color .2s ease";
const HEADER = 'display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid rgba(45,53,39,.09)';
const Stepper = ({ dec, qty, inc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Box as="span" onClick={dec} style="display:grid;place-items:center;width:25px;height:25px;border-radius:7px;border:1px solid rgba(45,53,39,.16);cursor:pointer;font:600 13px 'Manrope',sans-serif;transition:border-color .2s ease" hover="border-color:rgba(45,53,39,.4)">−</Box>
    <span style={{ minWidth: 18, textAlign: 'center', font: "600 13px 'Space Mono',monospace" }}>{qty}</span>
    <Box as="span" onClick={inc} style="display:grid;place-items:center;width:25px;height:25px;border-radius:7px;border:1px solid rgba(45,53,39,.16);cursor:pointer;font:600 13px 'Manrope',sans-serif;transition:border-color .2s ease" hover="border-color:rgba(45,53,39,.4)">+</Box>
  </div>
);

// =================== CART / CHECKOUT POPUP ===================
export function CartPopup() {
  const v = usePortal();
  if (!v.cartOpen) return null;
  return (
    <Box className="ng-cartwrap" onClick={v.closeCart} style={OVERLAY + ';z-index:85'}>
      <Box className="ng-cartsheet" onClick={v.stopProp} style={SHEET}>
        <div className="ng-draghandle" style={{ display: 'none', width: 42, height: 4, borderRadius: 2, background: '#F3CBCD', margin: '10px auto 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(45,53,39,.09)' }}>
          <span style={{ font: "600 13.5px 'Manrope',sans-serif", letterSpacing: '.02em' }}>{v.checkoutTitle}</span>
          <Box as="span" onClick={v.closeCart} style={HEADCLOSE} hover="color:#2E3627">×</Box>
        </div>

        {v.inCheckoutFlow && (
          <div style={{ padding: '16px 24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ font: "600 10px 'Space Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#5A6B4B' }}>{v.stepProgressLabel}</span>
              <span style={{ font: "500 10.5px 'Manrope',sans-serif", color: '#99A18C' }}>{v.cartSubtotalStr}</span>
            </div>
            <div style={{ height: 3, borderRadius: 999, background: 'rgba(45,53,39,.09)', overflow: 'hidden' }}><Box as="div" style={v.stepFillStyle} /></div>
          </div>
        )}

        {v.isCartStep && (
          <div style={{ padding: '20px 24px 24px' }}>
            {v.cartHasItems ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {v.cartLines.map((l) => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13.5px 'Manrope',sans-serif" }}>{l.name}</div><div style={{ font: "400 11px 'Manrope',sans-serif", color: '#99A18C' }}>{l.mg} · {l.price} each</div></div>
                      <Stepper dec={l.dec} qty={l.qty} inc={l.inc} />
                      <span style={{ width: 56, textAlign: 'right', font: "600 13px 'Space Mono',monospace" }}>{l.lineStr}</span>
                      <span onClick={l.remove} style={{ cursor: 'pointer', color: '#A8442E', font: "400 16px 'Manrope',sans-serif" }}>×</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTop: '1px solid rgba(45,53,39,.09)', font: "600 15px 'Manrope',sans-serif" }}><span>Subtotal</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{v.cartSubtotalStr}</span></div>
                <Box as="span" onClick={v.goShipping} style="display:block;text-align:center;margin-top:18px;font:600 13px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:14px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">Proceed to checkout</Box>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '34px 10px' }}><div style={{ font: "600 15px 'Manrope',sans-serif", color: '#2E3627' }}>Your cart is empty</div><div style={{ font: "400 12.5px 'Manrope',sans-serif", color: '#99A18C', marginTop: 6 }}>Add compounds from the catalog to get started.</div></div>
            )}
          </div>
        )}

        {v.isShipStep && (
          <div style={{ padding: '18px 24px 24px' }}>
            <span onClick={v.backToCart} style={{ font: "600 11px 'Manrope',sans-serif", color: '#5A6B4B', cursor: 'pointer' }}>← Back to cart</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <Field label="Full name" value={v.coName} onChange={v.onCoName} placeholder="Dr. Jane Okafor" />
              <Area label="Street address" value={v.coAddr} onChange={v.onCoAddr} placeholder="Institute of Molecular Research, 418 Marine Pkwy" rows={2} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Field wrapStyle={{ flex: 1.4 }} label="City" value={v.coCity} onChange={v.onCoCity} placeholder="San Diego" />
                <Field wrapStyle={{ flex: 0.7 }} label="State" value={v.coState} onChange={v.onCoState} placeholder="CA" />
                <Field wrapStyle={{ flex: 0.9 }} label="ZIP" value={v.coZip} onChange={v.onCoZip} placeholder="92101" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, paddingTop: 13, borderTop: '1px solid rgba(45,53,39,.09)', font: "600 15px 'Manrope',sans-serif" }}><span>Order total</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{v.cartSubtotalStr}</span></div>
            <Box as="span" onClick={v.goPayment} style="display:block;text-align:center;margin-top:16px;font:600 13px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:14px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">Continue to payment</Box>
          </div>
        )}

        {v.isPaymentStep && (
          <div style={{ padding: '18px 24px 24px' }}>
            <span onClick={v.backToShipping} style={{ font: "600 11px 'Manrope',sans-serif", color: '#5A6B4B', cursor: 'pointer' }}>← Back to shipping</span>
            <div style={{ marginTop: 14, background: '#9EAF8B', borderRadius: 13, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: "500 10px 'Space Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.75)' }}>Amount due</span>
              <span style={{ font: "600 27px 'Spectral',serif", color: '#FFFFFF' }}>{v.cartSubtotalStr}</span>
            </div>
            <p style={{ margin: '16px 0 10px', font: "400 12.5px/1.65 'Manrope',sans-serif", color: '#4A5540' }}>Send payment by bank transfer using the details below, then upload your proof of payment. Orders ship once payment is verified.</p>
            <div style={{ background: '#fff', border: '1px solid rgba(45,53,39,.11)', borderRadius: 11, padding: '14px 17px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12px 'Manrope',sans-serif", padding: '4px 0' }}><span style={{ color: '#78826B' }}>Bank</span><span style={{ color: '#2E3627' }}>{BANK_DETAILS.bankName}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12px 'Manrope',sans-serif", padding: '4px 0' }}><span style={{ color: '#78826B' }}>Account name</span><span style={{ color: '#2E3627' }}>{BANK_DETAILS.accountName}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12px 'Manrope',sans-serif", padding: '4px 0' }}><span style={{ color: '#78826B' }}>Account no.</span><span style={{ fontFamily: "'Space Mono',monospace", color: '#2E3627' }}>{BANK_DETAILS.accountNumber}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12px 'Manrope',sans-serif", padding: '4px 0' }}><span style={{ color: '#78826B' }}>Routing</span><span style={{ fontFamily: "'Space Mono',monospace", color: '#2E3627' }}>{BANK_DETAILS.routing}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 12px 'Manrope',sans-serif", padding: '8px 0 4px', borderTop: '1px solid rgba(45,53,39,.08)', marginTop: 4 }}><span style={{ color: '#78826B' }}>Reference</span><span style={{ color: '#5A6B4B' }}>{BANK_DETAILS.reference}</span></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#78826B', marginBottom: 7 }}>Proof of payment</div>
              {v.proofStatus === 'attached' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid rgba(62,124,91,.4)', background: 'rgba(62,124,91,.07)', borderRadius: 11, padding: '13px 15px', animation: 'ngRise .3s ease' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', background: '#3E7C5B', color: '#fff', fontSize: 13, animation: 'ngStamp .45s cubic-bezier(.34,1.56,.64,1)' }}>✓</span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 12.5px 'Manrope',sans-serif", color: '#2E3627', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.proofName}</div><div style={{ font: "400 10.5px 'Manrope',sans-serif", color: '#78826B' }}>Attached · uploaded securely</div></div>
                  <span onClick={v.clearProof} style={{ cursor: 'pointer', color: '#A8442E', font: "400 16px 'Manrope',sans-serif" }}>×</span>
                </div>
              ) : v.proofStatus === 'uploading' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid rgba(45,53,39,.18)', background: '#FFF7F1', borderRadius: 11, padding: '13px 15px' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(90,107,75,.3)', borderTopColor: '#5A6B4B', animation: 'ngSpin .8s linear infinite' }} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 12.5px 'Manrope',sans-serif", color: '#2E3627', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.proofName || 'Receipt'}</div><div style={{ font: "400 10.5px 'Manrope',sans-serif", color: '#78826B' }}>Uploading…</div></div>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: v.proofStatus === 'error' ? '1.5px dashed rgba(168,68,46,.5)' : '1.5px dashed rgba(45,53,39,.22)', borderRadius: 11, padding: 24, cursor: 'pointer', background: v.proofStatus === 'error' ? 'rgba(168,68,46,.06)' : '#FFF1F1', textAlign: 'center', transition: 'border-color .2s ease' }}>
                  <Upload s={22} c={v.proofStatus === 'error' ? '#A8442E' : '#5A6B4B'} w={1.6} />
                  <span style={{ font: "600 12.5px 'Manrope',sans-serif", color: v.proofStatus === 'error' ? '#A8442E' : '#2E3627' }}>{v.proofStatus === 'error' ? 'Upload failed — choose another file' : 'Click to upload receipt'}</span>
                  <span style={{ font: "400 10.5px 'Manrope',sans-serif", color: '#99A18C' }}>PDF, PNG, JPG or WebP · max 5 MB</span>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" onChange={v.onProofFile} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <Box as="span" onClick={v.submitOrder} style={v.submitOrderStyle} hover="background:#8A9E76">{v.submitLabel}</Box>
          </div>
        )}

        {v.isDoneStep && (
          <div style={{ padding: '38px 26px', textAlign: 'center' }}>
            <div style={{ display: 'inline-grid', placeItems: 'center', width: 50, height: 50, borderRadius: '50%', background: '#3E7C5B', color: '#fff', fontSize: 24, marginBottom: 18, animation: 'ngStamp .5s cubic-bezier(.34,1.56,.64,1)' }}>✓</div>
            <h2 style={{ margin: 0, font: "300 28px 'Spectral',serif" }}>Order placed</h2>
            <p style={{ margin: '12px auto 0', maxWidth: 320, font: "400 13px/1.7 'Manrope',sans-serif", color: '#4A5540' }}>Order <span style={{ fontFamily: "'Space Mono',monospace", color: '#2E3627' }}>{v.lastOrderId}</span> received and is now being processed — track it under <span onClick={v.doneGoOrders} style={{ color: '#5A6B4B', cursor: 'pointer', fontWeight: 600 }}>My orders</span>.</p>
            <Box as="span" onClick={v.closeCart} style="display:inline-block;margin-top:22px;font:600 13px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:13px 30px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">Done</Box>
          </div>
        )}
      </Box>
    </Box>
  );
}

// =================== CANCEL ORDER MODAL ===================
export function CancelModal() {
  const v = usePortal();
  if (!v.cancelOpen) return null;
  return (
    <Box onClick={v.cancelKeep} style={OVERLAY + ';z-index:87'}>
      <Box onClick={v.stopProp} style={SHEET.replace('width:464px', 'width:440px')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(45,53,39,.09)' }}>
          <span style={{ font: "600 13.5px 'Manrope',sans-serif" }}>Cancel order <span style={{ fontFamily: "'Space Mono',monospace" }}>{v.cancelOrderId}</span></span>
          <Box as="span" onClick={v.cancelKeep} style={HEADCLOSE} hover="color:#2E3627">×</Box>
        </div>
        <div style={{ padding: '18px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ font: "400 11.5px/1.55 'Manrope',sans-serif", color: '#7A3A2A', background: 'rgba(168,68,46,.06)', border: '1px solid rgba(168,68,46,.22)', borderRadius: 11, padding: '12px 14px' }}>Cancelling releases the reserved vials back into inventory and records the reason on the order.</div>
          <div>
            <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#78826B', marginBottom: 5 }}>Reason</div>
            <select value={v.cancelReason} onChange={v.onCancelReason} style={{ width: '100%', font: "500 13.5px 'Manrope',sans-serif", color: '#2E3627', background: '#fff', border: '1.5px solid rgba(45,53,39,.13)', borderRadius: 10, padding: '11px 12px' }}>
              <option value="Payment incorrect">Payment incorrect</option>
              <option value="Payment not received">Payment not received</option>
              <option value="Out of stock">Out of stock</option>
              <option value="Requested by customer">Requested by customer</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#78826B', marginBottom: 5 }}>Message to customer <span style={{ color: '#8B947E' }}>· optional</span></div>
            <textarea rows={3} value={v.cancelMsg} onChange={v.onCancelMsg} placeholder="Add a note the customer will see with the cancellation." style={{ width: '100%', font: "500 13px/1.5 'Manrope',sans-serif", color: '#2E3627', background: '#fff', border: '1.5px solid rgba(45,53,39,.13)', borderRadius: 10, padding: '11px 12px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Box as="span" onClick={v.cancelKeep} style="flex:1;display:block;text-align:center;font:600 13px 'Manrope',sans-serif;padding:14px;border-radius:999px;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.16);cursor:pointer;transition:all .2s ease" hover="border-color:rgba(45,53,39,.4)">Keep order</Box>
            <Box as="span" onClick={v.cancelConfirm} style="flex:1;display:block;text-align:center;font:600 13px 'Manrope',sans-serif;padding:14px;border-radius:999px;color:#FFFFFF;background:#A8442E;cursor:pointer;transition:all .2s ease" hover="background:#8E3626">{v.cancelBusy ? 'Cancelling…' : 'Confirm cancel'}</Box>
          </div>
        </div>
      </Box>
    </Box>
  );
}

// =================== EDIT ORDER MODAL ===================
export function EditOrderModal() {
  const v = usePortal();
  if (!v.editOpen) return null;
  return (
    <Box onClick={v.closeEdit} style={OVERLAY + ';z-index:86'}>
      <Box onClick={v.stopProp} style={SHEET}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(45,53,39,.09)' }}>
          <span style={{ font: "600 13.5px 'Manrope',sans-serif" }}>Edit order <span style={{ fontFamily: "'Space Mono',monospace" }}>{v.editId}</span></span>
          <Box as="span" onClick={v.closeEdit} style={HEADCLOSE} hover="color:#2E3627">×</Box>
        </div>
        <div style={{ padding: '18px 24px 24px' }}>
          <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 9 }}>Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {v.editLines.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13.5px 'Manrope',sans-serif" }}>{l.name}</div><div style={{ font: "400 11px 'Manrope',sans-serif", color: '#99A18C' }}>{l.mg} · {l.price} each</div></div>
                <Stepper dec={l.dec} qty={l.qty} inc={l.inc} />
                <span style={{ width: 56, textAlign: 'right', font: "600 13px 'Space Mono',monospace" }}>{l.lineStr}</span>
                <span onClick={l.remove} style={{ cursor: 'pointer', color: '#A8442E', font: "400 16px 'Manrope',sans-serif" }}>×</span>
              </div>
            ))}
            {v.editEmpty && <div style={{ textAlign: 'center', padding: 14, font: "400 12px 'Manrope',sans-serif", color: '#A8442E' }}>All items removed — use Cancel on the order instead.</div>}
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A6B4B', marginBottom: 9 }}>Add a product</div>
            <div style={{ background: '#fff', border: '1px solid rgba(45,53,39,.11)', borderRadius: 11, maxHeight: 168, overflowY: 'auto' }}>
              {v.editCatalog.map((p) => (
                <Box key={p.id} onClick={p.add} style={p.rowStyle} active="background:#FFF1F1">
                  <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ font: "600 12.5px 'Manrope',sans-serif", color: '#2E3627' }}>{p.name}</span> <span style={{ font: "400 10.5px 'Manrope',sans-serif", color: '#99A18C' }}>{p.mg}</span>
                  </div>
                  <span style={{ flex: 'none', font: "500 11px 'Space Mono',monospace", color: '#78826B' }}>{p.price}</span>
                  <Box as="span" style={p.addStyle}>{p.addLabel}</Box>
                </Box>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Recipient" value={v.editName} onChange={v.onEditName} />
            <Area label="Shipping address" value={v.editAddr} onChange={v.onEditAddr} rows={3} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 13, borderTop: '1px solid rgba(45,53,39,.09)', font: "600 15px 'Manrope',sans-serif" }}><span>New total</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{v.editTotalStr}</span></div>
          <p style={{ margin: '10px 0 0', font: "400 10.5px/1.6 'Space Mono',monospace", color: '#99A18C' }}>Quantity changes sync with inventory automatically.</p>
          <Box as="span" onClick={v.saveEdit} style={v.editSaveStyle} hover="background:#8A9E76">{v.editBusy ? 'Saving…' : 'Save changes'}</Box>
        </div>
      </Box>
    </Box>
  );
}

// =================== NEW PEPTIDE MODAL ===================
export function NewPeptideModal() {
  const v = usePortal();
  if (!v.npOpen) return null;
  const chip = (active) => (active
    ? "font:600 11px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:8px 15px;border-radius:999px;cursor:pointer;white-space:nowrap"
    : "font:600 11px 'Manrope',sans-serif;color:#4A5540;background:#fff;border:1px solid rgba(45,53,39,.14);padding:8px 15px;border-radius:999px;cursor:pointer;white-space:nowrap");
  return (
    <Box onClick={v.closeNp} style={OVERLAY + ';z-index:86'}>
      <Box onClick={v.stopProp} style={SHEET}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(45,53,39,.09)' }}>
          <span style={{ font: "600 13.5px 'Manrope',sans-serif" }}>New peptide</span>
          <Box as="span" onClick={v.closeNp} style={HEADCLOSE} hover="color:#2E3627">×</Box>
        </div>
        <div style={{ padding: '18px 24px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Field label="Name *" value={v.npName} onChange={v.onNpName} placeholder="e.g. BPC-157" />
          <Field label="Sequence / description" value={v.npSub} onChange={v.onNpSub} placeholder="e.g. Pentadecapeptide · Gly-Glu-Pro…" />
          <div>
            <div style={{ font: "500 9px 'Space Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#78826B', marginBottom: 7 }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {v.npCats.map((c) => (
                <Box key={c} as="span" onClick={() => v.setNpCat(c)} style={chip(v.npCat === c)}>{c}</Box>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field wrapStyle={{ flex: 1 }} label="Amount" value={v.npMg} onChange={v.onNpMg} placeholder="50 mg" />
            <Field wrapStyle={{ flex: 1 }} label="Price ($) *" value={v.npPrice} onChange={v.onNpPrice} placeholder="85" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field wrapStyle={{ flex: 1 }} label="Initial stock" value={v.npStock} onChange={v.onNpStock} placeholder="50" />
          </div>
          <Field label="Lot number *" value={v.npLot} onChange={v.onNpLot} placeholder="e.g. 26·0521" mono />
          <Box as="span" onClick={v.createPeptide} style={v.npCreateStyle} hover="background:#8A9E76">{v.npBusy ? 'Adding…' : 'Add to catalog'}</Box>
          <p style={{ margin: 0, font: "400 10px/1.6 'Space Mono',monospace", color: '#99A18C', textAlign: 'center' }}>Appears immediately in the customer catalog and marketing site, with a verifiable COA.</p>
        </div>
      </Box>
    </Box>
  );
}

// =================== EDIT INVENTORY MODAL ===================
export function EditInventoryModal() {
  const v = usePortal();
  if (!v.editInvOpen) return null;
  return (
    <Box onClick={v.closeEditInv} style={OVERLAY + ';z-index:86'}>
      <Box onClick={v.stopProp} style={SHEET}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(45,53,39,.09)' }}>
          <span style={{ font: "600 13.5px 'Manrope',sans-serif" }}>Edit inventory</span>
          <Box as="span" onClick={v.closeEditInv} style={HEADCLOSE} hover="color:#2E3627">×</Box>
        </div>
        <div style={{ padding: '18px 24px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ font: "400 20px 'Spectral',serif", color: '#2E3627' }}>{v.editInvName}</div>
          <Field label="Current stock" value={v.editInvStock} onChange={v.onEditInvStock} placeholder="0" />
          {v.editInvHasCoa && <Field label="Lot / batch" value={v.editInvLot} onChange={v.onEditInvLot} placeholder="e.g. 26·0701" mono />}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Box as="span" onClick={v.closeEditInv} style="flex:1;display:block;text-align:center;font:600 13px 'Manrope',sans-serif;padding:14px;border-radius:999px;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.16);cursor:pointer;transition:all .2s ease" hover="border-color:rgba(45,53,39,.4)">Cancel</Box>
            <Box as="span" onClick={v.saveEditInv} style="flex:1;display:block;text-align:center;font:600 13px 'Manrope',sans-serif;padding:14px;border-radius:999px;color:#FFFFFF;background:#9EAF8B;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">{v.invBusy ? 'Saving…' : 'Save changes'}</Box>
          </div>
          <p style={{ margin: 0, font: "400 10px/1.6 'Space Mono',monospace", color: '#99A18C', textAlign: 'center' }}>{v.editInvHasCoa ? 'Set the exact on-hand quantity. The lot / COA only changes if you edit the lot field.' : 'Set the exact on-hand quantity. This consumable carries no lot or COA.'}</p>
        </div>
      </Box>
    </Box>
  );
}

// =================== PROOF-OF-PAYMENT MODAL ===================
// Streams the REAL uploaded bytes from GET /api/proofs/{orderId}. The same-origin
// session cookie rides along automatically, so the authenticated iframe/link
// renders (or downloads) exactly what the customer uploaded.
export function ProofModal() {
  const v = usePortal();
  if (!v.showProof) return null;
  const r = v.proofView;
  return (
    <Box onClick={v.closeProof} style={OVERLAY + ';z-index:86'}>
      <Box onClick={v.stopProp} style={SHEET.replace('width:464px', 'width:560px')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(45,53,39,.09)' }}>
          <span style={{ font: "600 13.5px 'Manrope',sans-serif" }}>Proof of payment <span style={{ fontFamily: "'Space Mono',monospace", color: '#78826B' }}>· {r.ref}</span></span>
          <Box as="span" onClick={v.closeProof} style={HEADCLOSE} hover="color:#2E3627">×</Box>
        </div>
        <div style={{ padding: '18px 24px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <FileIcon s={14} c="#4A5540" w={1.7} />
            <span style={{ flex: 1, minWidth: 0, font: "500 12px 'Manrope',sans-serif", color: '#2E3627', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.file}</span>
            <a href={r.src} target="_blank" rel="noopener noreferrer" style={{ font: "600 11px 'Manrope',sans-serif", color: '#5A6B4B', textDecoration: 'none', whiteSpace: 'nowrap' }}>Open in new tab →</a>
          </div>
          <div style={{ border: '1px solid rgba(45,53,39,.14)', borderRadius: 12, overflow: 'hidden', background: '#F4EEE9' }}>
            <iframe title={`Proof of payment ${r.ref}`} src={r.src} style={{ width: '100%', height: '62vh', border: 'none', display: 'block', background: '#fff' }} />
          </div>
          <p style={{ margin: '14px 0 0', font: "400 10px/1.6 'Space Mono',monospace", color: '#99A18C', textAlign: 'center' }}>The document the customer uploaded, served securely from this session. If it does not render, use “Open in new tab”.</p>
          <Box as="span" onClick={v.closeProof} style="display:block;text-align:center;margin-top:14px;font:600 13px 'Manrope',sans-serif;padding:13px;border-radius:999px;color:#FFFFFF;background:#9EAF8B;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76">Close</Box>
        </div>
      </Box>
    </Box>
  );
}
