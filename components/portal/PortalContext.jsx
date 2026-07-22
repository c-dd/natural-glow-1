'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import {
  useProducts, useInventory, useCart, useOrders, useAccount, useMobile,
  readCart, bumpCart, clearCart,
  setStock, bumpStock, setLot, addExtraProduct,
  placeOrder as apiPlaceOrder, shipOrder, cancelOrder as apiCancelOrder, updateOrder,
  readAccount, writeAccount, initials,
  useSession, readSessionUser, logout as apiLogout,
  CATEGORIES, hasCOA,
} from '@/lib/store';

// ---------------------------------------------------------------------------
// The entire dashboard state machine, ported from the original design source's
// <script type="text/x-dc"> block (class Component / renderVals). All local UI
// state lives here; global data (products, inventory, cart, orders, account)
// comes from the lib/store hooks. Exposed as one big `v` object via context,
// mirroring the original renderVals() return.
// ---------------------------------------------------------------------------

const PortalContext = createContext(null);
export const usePortal = () => useContext(PortalContext);

// ---- style helpers (verbatim from the source) ----
const fmt = (n) => '$' + n;
const statColor = (st) => ({ Processing: '#B07A24', Shipped: '#3E7C5B', Cancelled: '#A8442E' }[st] || '#78826B');
const statBg = (st) => ({ Processing: 'rgba(176,122,36,.1)', Shipped: 'rgba(62,124,91,.13)', Cancelled: 'rgba(168,68,46,.1)' }[st] || 'rgba(45,53,39,.08)');
const statusPill = (st) => `font:600 9px 'Space Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:${statColor(st)};background:${statBg(st)};padding:5px 11px;border-radius:999px;`;
const stockDot = (s) => `display:inline-block;width:7px;height:7px;border-radius:50%;background:${s <= 0 ? '#A8442E' : (s <= 20 ? '#B07A24' : '#3E7C5B')};`;
const stockLbl = (s) => (s <= 0 ? 'Out' : (s <= 20 ? 'Low' : 'In stock'));
const stepDot = (on) => `width:11px;height:11px;border-radius:50%;background:${on ? '#3E7C5B' : '#F3CBCD'};flex:none;transition:background .3s ease;`;
const stepLine = (on) => `flex:1;height:2px;background:${on ? '#3E7C5B' : '#F3CBCD'};transition:background .3s ease;`;
const sideStyle = (a) => `font:600 12.5px 'Manrope',sans-serif;padding:10px 12px;border-radius:9px;cursor:pointer;transition:all .2s ease;color:${a ? '#FFFFFF' : 'rgba(255,255,255,.75)'};background:${a ? 'rgba(255,255,255,.16)' : 'transparent'};`;
const mtabStyle = (a) => `font:600 13px 'Manrope',sans-serif;padding:14px 0 12px;cursor:pointer;transition:color .2s ease;border-bottom:2px solid ${a ? '#5A6B4B' : 'transparent'};color:${a ? '#2E3627' : '#78826B'};`;

const dateObj = (iso) => { const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? null : d; };
const monthLabel = (iso) => { const d = dateObj(iso); return d ? d.toLocaleString('en-US', { month: 'long' }).toUpperCase() + ' ' + d.getFullYear() : String(iso); };
const shortDate = (iso) => { const d = dateObj(iso); return d ? d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getDate() : String(iso); };
const longDate = (iso) => { const d = dateObj(iso); return d ? d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : String(iso); };
const todayISO = () => new Date().toISOString().slice(0, 10);

export function PortalProvider({ children }) {
  const router = useRouter();
  const isMobile = useMobile(760);

  // ---- global stores ----
  const baseProducts = useProducts();
  const inv = useInventory();
  const cart = useCart();
  const orders = useOrders();
  const account = useAccount();

  // ---- session / role (admin gating rides on the confirmed /me response) ----
  const session = useSession();
  const role = (session.user && session.user.role) || 'user';
  const isAdmin = role === 'admin';

  const products = baseProducts.map((p) => ({ ...p, stock: inv.stock[p.id] ?? 0 }));
  const pById = {};
  products.forEach((p) => { pById[p.id] = p; });
  const priceOf = (id) => pById[id]?.price || 0;
  const nameOf = (id) => pById[id]?.name || '';
  const mgOf = (id) => pById[id]?.mg || '';
  const orderTotal = (o) => o.items.reduce((a, it) => a + priceOf(it.id) * it.qty, 0);

  // ---- local UI state ----
  const [viewAs, setViewAs] = useState('customer');
  const [dashView, setDashView] = useState('catalog');
  const [orderDetailId, setOrderDetailId] = useState(null);
  const [dashSearch, setDashSearch] = useState('');
  const [dashNav, setDashNav] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [coName, setCoName] = useState('');
  const [coAddr, setCoAddr] = useState('');
  const [coCity, setCoCity] = useState('');
  const [coState, setCoState] = useState('');
  const [coZip, setCoZip] = useState('');
  const [proofName, setProofName] = useState('');
  const [lastOrderId, setLastOrderId] = useState('');

  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('Payment incorrect');
  const [cancelMsg, setCancelMsg] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editName, setEditName] = useState('');
  const [editAddr, setEditAddr] = useState('');

  const [npOpen, setNpOpen] = useState(false);
  const [npBusy, setNpBusy] = useState(false);
  const [npName, setNpName] = useState('');
  const [npSub, setNpSub] = useState('');
  const [npCat, setNpCat] = useState(CATEGORIES[0]);
  const [npMg, setNpMg] = useState('');
  const [npPrice, setNpPrice] = useState('');
  const [npStock, setNpStock] = useState('');
  const [npLot, setNpLot] = useState('');

  const [editInvOpen, setEditInvOpen] = useState(false);
  const [invBusy, setInvBusy] = useState(false);
  const [editInvId, setEditInvId] = useState(null);
  const [editInvName, setEditInvName] = useState('');
  const [editInvStock, setEditInvStock] = useState('');
  const [editInvLot, setEditInvLot] = useState('');
  const [editInvHasCoa, setEditInvHasCoa] = useState(false);

  const [proofId, setProofId] = useState(null);

  const [acctName, setAcctName] = useState(() => readAccount().name || '');
  const [acctEmail, setAcctEmail] = useState(() => readAccount().email || '');
  const [acctOrg, setAcctOrg] = useState(() => readAccount().org || '');
  const [acctAddr, setAcctAddr] = useState(() => readAccount().address1 || '');
  const [acctCity, setAcctCity] = useState(() => readAccount().city || '');
  const [acctState, setAcctState] = useState(() => readAccount().state || '');
  const [acctZip, setAcctZip] = useState(() => readAccount().zip || '');
  const [acctCountry, setAcctCountry] = useState(() => readAccount().country || '');
  const [acctPwCur, setAcctPwCur] = useState('');
  const [acctPwNew, setAcctPwNew] = useState('');
  const [acctPwConf, setAcctPwConf] = useState('');
  const [acctBusy, setAcctBusy] = useState(false);

  const scrollTop = () => { try { window.scrollTo(0, 0); } catch (e) {} };

  const populateAccount = () => {
    const a = readAccount();
    setAcctName(a.name || ''); setAcctEmail(a.email || ''); setAcctOrg(a.org || '');
    setAcctAddr(a.address1 || ''); setAcctCity(a.city || ''); setAcctState(a.state || '');
    setAcctZip(a.zip || ''); setAcctCountry(a.country || '');
    setAcctPwCur(''); setAcctPwNew(''); setAcctPwConf('');
  };

  // ---- deep link: ?view= and ?cart=1 ----
  // The session is already confirmed by the dashboard guard before this mounts,
  // so readSessionUser() reflects the real role — admin views are gated on it.
  useEffect(() => {
    const admin = ((readSessionUser() || {}).role) === 'admin';
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'orders' || view === 'inventory') {
      if (admin) { setViewAs('admin'); setDashView(view); }
      else { setViewAs('customer'); setDashView('catalog'); }
    }
    else if (view === 'catalog' || view === 'myorders') { setViewAs('customer'); setDashView(view); }
    else if (view === 'account') { setViewAs('customer'); setDashView('account'); populateAccount(); }
    if (params.get('cart') === '1') { setCartOpen(true); setCheckoutStep('cart'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: if the confirmed session is NOT admin, never leave the UI in an
  // admin view (e.g. an optimistic hint that the API later downgrades).
  useEffect(() => {
    if (!isAdmin && viewAs === 'admin') { setViewAs('customer'); setDashView('catalog'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // ---- navigation ----
  const goHome = () => router.push('/');
  const goContact = () => router.push('/contact');
  const logout = async () => {
    setDashNav(false);
    try { await apiLogout(); } catch { /* clear locally regardless */ }
    router.push('/');
  };

  const setCustomer = () => { setViewAs('customer'); setDashView('catalog'); };
  const setAdmin = () => { if (!isAdmin) return; setViewAs('admin'); setDashView('orders'); };
  const goCustCatalog = () => setDashView('catalog');
  const goCustOrders = () => setDashView('myorders');
  const goAdmOrders = () => setDashView('orders');
  const goAdmInventory = () => setDashView('inventory');
  const goAccount = () => { populateAccount(); setDashView('account'); scrollTop(); };
  const backToOrders = () => setDashView('myorders');

  const drawerCustCatalog = () => { setViewAs('customer'); setDashView('catalog'); setDashNav(false); };
  const drawerCustOrders = () => { setViewAs('customer'); setDashView('myorders'); setDashNav(false); };
  const drawerAdmOrders = () => { setViewAs('admin'); setDashView('orders'); setDashNav(false); };
  const drawerAdmInventory = () => { setViewAs('admin'); setDashView('inventory'); setDashNav(false); };
  const drawerAccount = () => { populateAccount(); setViewAs('customer'); setDashView('account'); setDashNav(false); scrollTop(); };

  const toggleDashNav = () => { setDashNav((x) => !x); setCartOpen(false); };
  const closeDashNav = () => setDashNav(false);

  // ---- cart ----
  const openCart = () => { setCartOpen(true); setCheckoutStep('cart'); setDashNav(false); };
  const closeCart = () => { setCartOpen(false); setCheckoutStep('cart'); };
  const addItem = (id) => { bumpCart(id, 1); const p = pById[id]; toast((p ? p.name : 'Item') + ' added to cart', { label: 'View cart →', onClick: openCart }); };
  const incItem = (id) => bumpCart(id, 1);
  const decItem = (id) => bumpCart(id, -1);
  const removeItem = (id) => bumpCart(id, -(cart[id] || 0));

  const goShipping = () => {
    if (Object.keys(readCart()).length === 0) return;
    const a = readAccount();
    if (!(coName || '').trim()) setCoName(a.name || '');
    if (!(coAddr || '').trim()) setCoAddr(a.address1 || '');
    if (!(coCity || '').trim()) setCoCity(a.city || '');
    if (!(coState || '').trim()) setCoState(a.state || '');
    if (!(coZip || '').trim()) setCoZip(a.zip || '');
    setCheckoutStep('shipping');
  };
  const goPayment = () => { if (Object.keys(readCart()).length) setCheckoutStep('payment'); };
  const backToCart = () => setCheckoutStep('cart');
  const backToShipping = () => setCheckoutStep('shipping');

  const doPlaceOrder = (ov = {}) => {
    const co = {
      name: ov.coName ?? coName, addr: ov.coAddr ?? coAddr, city: ov.coCity ?? coCity,
      st: ov.coState ?? coState, zip: ov.coZip ?? coZip, proof: ov.proofName ?? proofName,
    };
    const items = Object.entries(readCart()).map(([id, qty]) => ({ id, qty: Number(qty) }));
    if (!items.length || !co.proof) return;
    const cityLine = [co.city, [co.st, co.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const address = [co.addr, cityLine].filter(Boolean).join('\n') || '—';
    const name = (co.name || '').trim() || account.name || 'Researcher';
    const id = apiPlaceOrder({ items, name, address, proof: co.proof, placed: todayISO() });
    clearCart();
    setLastOrderId(id); setCheckoutStep('done');
    setCoName(''); setCoAddr(''); setCoCity(''); setCoState(''); setCoZip(''); setProofName('');
  };
  const submitOrder = () => doPlaceOrder();
  const simulatePayment = () => {
    const ov = {
      coName: (coName || '').trim() || account.name || 'Dr. Jane Okafor',
      coAddr: (coAddr || '').trim() || 'Institute of Molecular Research, 418 Marine Pkwy',
      coCity: (coCity || '').trim() || 'San Diego',
      coState: (coState || '').trim() || 'CA',
      coZip: (coZip || '').trim() || '92101',
      proofName: 'payment-receipt.pdf',
    };
    setCoName(ov.coName); setCoAddr(ov.coAddr); setCoCity(ov.coCity); setCoState(ov.coState); setCoZip(ov.coZip); setProofName(ov.proofName);
    doPlaceOrder(ov);
  };
  const onProofFile = (e) => { const f = e.target.files && e.target.files[0]; setProofName(f ? f.name : 'receipt.pdf'); };
  const clearProof = () => setProofName('');
  const doneGoOrders = () => { setCartOpen(false); setCheckoutStep('cart'); setViewAs('customer'); setDashView('myorders'); };

  // ---- admin order actions ----
  const askCancel = (id) => { setCancelId(id); setCancelReason('Payment incorrect'); setCancelMsg(''); };
  const cancelKeep = () => setCancelId(null);
  const cancelConfirm = () => {
    if (!cancelId) return;
    apiCancelOrder(cancelId, cancelReason || 'Requested by customer', (cancelMsg || '').trim());
    setCancelId(null); setCancelReason('Payment incorrect'); setCancelMsg('');
    toast('Order cancelled · inventory restocked');
  };

  const openEdit = (id) => {
    const o = orders.find((x) => x.id === id); if (!o) return;
    setEditId(id);
    setEditItems(o.items.map((it) => ({ id: it.id, name: nameOf(it.id), mg: mgOf(it.id), qty: it.qty, priceN: priceOf(it.id) })));
    setEditName(o.customer); setEditAddr(o.address); setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);
  const editInc = (id) => setEditItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  const editDec = (id) => setEditItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: it.qty - 1 } : it)).filter((it) => it.qty > 0));
  const editRemove = (id) => setEditItems((prev) => prev.filter((it) => it.id !== id));
  const editAdd = (id) => {
    const p = pById[id]; if (!p) return;
    setEditItems((prev) => {
      const ex = prev.find((it) => it.id === id);
      return ex ? prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)) : [...prev, { id: p.id, name: p.name, mg: p.mg, qty: 1, priceN: p.price }];
    });
  };
  const saveEdit = () => {
    const o = orders.find((x) => x.id === editId); if (!o || !editItems.length) return;
    if (o.status !== 'Shipped' && o.status !== 'Cancelled') {
      const oldMap = {}; o.items.forEach((it) => { oldMap[it.id] = it.qty; });
      const newMap = {}; editItems.forEach((it) => { newMap[it.id] = it.qty; });
      const ids = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
      ids.forEach((id) => { const delta = (oldMap[id] || 0) - (newMap[id] || 0); if (delta !== 0) bumpStock(id, delta); });
    }
    const items = editItems.map((it) => ({ id: it.id, qty: it.qty }));
    const total = editItems.reduce((a, it) => a + it.priceN * it.qty, 0);
    updateOrder(editId, { items, customer: editName, address: editAddr, total });
    setEditOpen(false);
    toast('Order updated · inventory synced');
  };

  // ---- new peptide ----
  // Admin-created products are COA-bearing (a lot is required), so they carry
  // a purity + a fresh released date and become verifiable immediately.
  const openNewPeptide = () => setNpOpen(true);
  const closeNp = () => setNpOpen(false);
  // POST /api/admin/products. Server mints the id, seeds stock, and stamps the
  // released date (COA-bearing since a lot is required here). Pessimistic: the
  // modal stays open + busy until the server confirms; 409 -> existing toast.
  const createPeptide = async () => {
    if (npBusy) return;
    const priceN = parseInt(npPrice, 10);
    const lot = npLot.trim().toUpperCase();
    if (!npName.trim() || isNaN(priceN) || !lot) { toast('Name, price, and lot number are required'); return; }
    if (products.some((p) => (p.lot || '').toUpperCase() === lot)) { toast('Lot ' + lot + ' already exists'); return; }
    const stock = parseInt(npStock, 10);
    setNpBusy(true);
    try {
      const created = await addExtraProduct({
        name: npName.trim(), sub: npSub.trim() || 'Reference material', cat: npCat,
        mg: npMg.trim() || '50 mg', price: priceN, lot, stock: isNaN(stock) ? 0 : stock,
      });
      setNpOpen(false); setNpName(''); setNpSub(''); setNpCat(CATEGORIES[0]); setNpMg(''); setNpPrice(''); setNpStock(''); setNpLot('');
      toast((created?.name || npName.trim()) + ' added to catalog');
    } catch (e) {
      if (e && (e.status === 409 || e.code === 'lot_exists')) toast('Lot ' + lot + ' already exists');
      else toast((e && e.message) || 'Could not add product — please try again');
    } finally {
      setNpBusy(false);
    }
  };

  // ---- edit inventory ----
  const openEditInv = (id) => {
    const p = pById[id]; if (!p) return;
    setEditInvId(id); setEditInvName(p.name + ' · ' + p.mg); setEditInvStock(String(p.stock));
    setEditInvLot(p.lot || ''); setEditInvHasCoa(hasCOA(p)); setEditInvOpen(true);
  };
  const closeEditInv = () => setEditInvOpen(false);
  // PATCH /api/admin/inventory for stock; PATCH /api/admin/products/:id for the
  // lot (COA-bearing only). Pessimistic + busy; the resource cache refreshes
  // from each response so the inventory table shows the server value.
  const saveEditInv = async () => {
    if (invBusy) return;
    const p = pById[editInvId]; if (!p) { setEditInvOpen(false); return; }
    const stock = parseInt(editInvStock, 10);
    if (isNaN(stock) || stock < 0) { toast('Enter a valid stock quantity (0 or more)'); return; }
    // Lot / COA only applies to COA-bearing products. A COA-less consumable
    // (syringe kit, bac water) saves stock-only — never blocked on a lot.
    const isCoa = hasCOA(p);
    let lotChanged = false, newLot = '';
    if (isCoa) {
      newLot = editInvLot.trim().toUpperCase();
      if (!newLot) { toast('Lot / batch is required'); return; }
      lotChanged = newLot !== (p.lot || '').toUpperCase();
      if (lotChanged && products.some((x) => x.id !== p.id && (x.lot || '').toUpperCase() === newLot)) { toast('Lot ' + newLot + ' already exists'); return; }
    }
    setInvBusy(true);
    try {
      await setStock(editInvId, stock);
      if (isCoa && lotChanged) await setLot(editInvId, newLot);
      setEditInvOpen(false);
      toast(p.name + ' inventory updated');
    } catch (e) {
      if (e && (e.status === 409 || e.code === 'lot_exists')) toast('Lot ' + newLot + ' already exists');
      else toast((e && e.message) || 'Could not update inventory — please try again');
    } finally {
      setInvBusy(false);
    }
  };

  // ---- account ----
  // PATCH /api/account. Profile fields save freely; an email change or a
  // password change requires the current password (server-verified). Busy +
  // typed-error toasts on the coded failures (BAD_CURRENT_PASSWORD/EMAIL_EXISTS).
  const saveAccount = async () => {
    if (acctBusy) return;
    const name = (acctName || '').trim();
    const email = (acctEmail || '').trim();
    if (!name) { toast('Name is required'); return; }
    if (!email || email.indexOf('@') === -1) { toast('Enter a valid email address'); return; }

    const patch = {
      name, email,
      org: (acctOrg || '').trim(), address1: (acctAddr || '').trim(),
      city: (acctCity || '').trim(), state: (acctState || '').trim(),
      zip: (acctZip || '').trim(), country: (acctCountry || '').trim(),
    };

    const cur = acctPwCur, nw = acctPwNew, cf = acctPwConf;
    const wantsPw = !!(nw || cf);
    if (wantsPw) {
      if (nw.length < 8) { toast('New password must be at least 8 characters'); return; }
      if (nw !== cf) { toast('New passwords do not match'); return; }
      if (!cur) { toast('Enter your current password to set a new one'); return; }
      patch.currentPassword = cur;
      patch.newPassword = nw;
    }

    const emailChanged = email.toLowerCase() !== ((account.email || '').toLowerCase());
    if (emailChanged) {
      if (!cur) { toast('Enter your current password to change your email'); return; }
      patch.currentPassword = cur;
    }

    setAcctBusy(true);
    try {
      await writeAccount(patch);
      setAcctPwCur(''); setAcctPwNew(''); setAcctPwConf('');
      toast('Account updated');
    } catch (e) {
      const code = e && e.code;
      if (code === 'BAD_CURRENT_PASSWORD') toast('Your current password is incorrect');
      else if (code === 'EMAIL_EXISTS') toast('That email is already in use');
      else if (code === 'validation_failed') toast('Please check your details and try again');
      else toast((e && e.message) || 'Could not save changes — please try again');
    } finally {
      setAcctBusy(false);
    }
  };

  const stopProp = (e) => { if (e && e.stopPropagation) e.stopPropagation(); };

  // ---- derived: catalog + inventory search ----
  const q = (dashSearch || '').trim().toLowerCase();
  const searched = products.filter((p) => !q || (p.name + ' ' + p.sub + ' ' + (p.cas || '') + ' ' + (p.lot || '')).toLowerCase().includes(q));
  const dashList = searched.map((p) => {
    const stock = p.stock; const inC = cart[p.id] || 0; const out = stock <= 0;
    const coa = hasCOA(p);
    return {
      id: p.id, name: p.name, sub: p.sub, mg: p.mg, lot: p.lot, hasCoa: coa,
      badge: p.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase(), price: fmt(p.price),
      stockDotStyle: stockDot(stock), stockLabel: stockLbl(stock),
      addLabel: out ? 'Out of stock' : (inC ? 'Added · ' + inC : 'Add'),
      addStyle: `flex:none;font:600 12px 'Manrope',sans-serif;padding:10px 20px;border-radius:999px;transition:transform .2s ease;` + (out ? `color:#99A18C;background:#FCE9EA;cursor:not-allowed;` : `color:#FFFFFF;background:#9EAF8B;cursor:pointer;`),
      addItem: () => { if (stock > 0) addItem(p.id); },
      viewCoa: coa ? (() => router.push(`/verify?lot=${encodeURIComponent(p.lot)}`)) : null,
    };
  });

  const invSearched = products.filter((p) => !q || (p.name + ' ' + p.sub + ' ' + (p.lot || '')).toLowerCase().includes(q));
  const invList = invSearched.map((p) => {
    const low = p.stock <= 20;
    return {
      id: p.id, name: p.name, mg: p.mg, cat: p.cat, lot: p.lot || '—', price: fmt(p.price), stock: p.stock,
      stockStyle: `min-width:40px;text-align:center;font:700 14px 'Space Mono',monospace;color:${low ? '#B07A24' : '#2E3627'};`,
      edit: () => openEditInv(p.id),
    };
  });
  const totalUnits = products.reduce((a, p) => a + p.stock, 0);
  const lowCount = products.filter((p) => p.stock <= 20).length;

  // ---- derived: cart ----
  const cartLines = Object.entries(cart).map(([id, qty]) => {
    const p = pById[id] || {}; const pn = p.price || 0;
    return { id, name: p.name, mg: p.mg, price: fmt(pn), qty, lineStr: fmt(pn * qty), lineN: pn * qty, inc: () => incItem(id), dec: () => decItem(id), remove: () => removeItem(id) };
  });
  const cartCount = Object.values(cart).reduce((a, x) => a + x, 0);
  const cartSubtotal = cartLines.reduce((a, l) => a + l.lineN, 0);

  // ---- derived: orders ----
  const orderView = (o) => {
    const idx = o.status === 'Processing' ? 1 : (o.status === 'Shipped' ? 2 : -1);
    return {
      id: o.id, date: o.placed, name: o.customer, address: o.address, status: o.status, custStatus: o.status, proof: o.proof || '—',
      openDetail: () => { setDashView('orderdetail'); setOrderDetailId(o.id); scrollTop(); },
      isProcessing: o.status === 'Processing', isCancelled: o.status === 'Cancelled',
      canEdit: o.status === 'Processing', showCancel: o.status === 'Processing',
      cancelReason: o.cancelReason || '', cancelMsg: o.cancelMsg || '', hasCancelMsg: !!(o.cancelMsg && ('' + o.cancelMsg).trim()),
      pillStyle: statusPill(o.status), totalStr: fmt(orderTotal(o)),
      cardStyle: `background:#fff;border:1px solid ${o.status === 'Cancelled' ? 'rgba(168,68,46,.25)' : 'rgba(45,53,39,.1)'};border-radius:14px;overflow:hidden;transition:border-color .2s ease;` + (o.status === 'Cancelled' ? 'opacity:.72;' : ''),
      items: o.items.map((it) => ({ name: nameOf(it.id), mg: mgOf(it.id), qty: it.qty, lineStr: fmt(priceOf(it.id) * it.qty) })),
      dot1: stepDot(idx >= 0), lineA: stepLine(idx >= 1), dot2: stepDot(idx >= 1), lineB: stepLine(idx >= 2), dot3: stepDot(idx >= 2),
      markShipped: () => { shipOrder(o.id); toast('Order marked shipped'); },
      viewProof: () => setProofId(o.id),
      openEdit: () => openEdit(o.id),
      askCancel: () => askCancel(o.id),
    };
  };
  const ordersList = orders.map(orderView);
  const myOrders = orders.filter((o) => o.mine).map(orderView);

  const mine = orders.filter((o) => o.mine);
  const groups = [];
  mine.forEach((o) => { const lb = monthLabel(o.placed); let g = groups.find((x) => x.label === lb); if (!g) { g = { label: lb, rows: [] }; groups.push(g); } g.rows.push(o); });
  const myOrderGroups = groups.map((g) => ({
    label: g.label,
    rows: g.rows.map((o, i) => ({
      id: o.id, dateShort: shortDate(o.placed), statusLine: '● ' + o.status.toUpperCase(),
      statusStyle: `font:500 10px 'Space Mono',monospace;letter-spacing:.06em;color:${statColor(o.status)};margin-top:4px;`,
      rowStyle: `display:flex;align-items:center;gap:12px;padding:15px 16px;cursor:pointer;` + (i === g.rows.length - 1 ? '' : `border-bottom:1px solid rgba(45,53,39,.07);`),
      totalStr: fmt(orderTotal(o)),
      open: () => { setDashView('orderdetail'); setOrderDetailId(o.id); scrollTop(); },
    })),
  }));

  let detailOrder = null;
  if (dashView === 'orderdetail') {
    const o = orders.find((x) => x.id === orderDetailId);
    if (o) {
      const idx = o.status === 'Processing' ? 1 : (o.status === 'Shipped' ? 2 : -1);
      const lbl = (on) => `font:500 8.5px 'Space Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:${on ? '#3E7C5B' : '#99A18C'};`;
      detailOrder = {
        id: o.id, dateLong: longDate(o.placed), statusLabel: o.status, isCancelled: o.status === 'Cancelled',
        cancelReason: o.cancelReason || '', cancelMsg: o.cancelMsg || '', hasCancelMsg: !!(o.cancelMsg && ('' + o.cancelMsg).trim()),
        pillStyle: `font:600 8.5px 'Space Mono',monospace;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;color:${statColor(o.status)};background:${statBg(o.status)};`,
        dot1: stepDot(idx >= 0), lineA: stepLine(idx >= 1), dot2: stepDot(idx >= 1), lineB: stepLine(idx >= 2), dot3: stepDot(idx >= 2),
        lbl1: lbl(idx >= 0), lbl2: lbl(idx >= 1), lbl3: lbl(idx >= 2),
        itemsLabel: o.items.length + (o.items.length === 1 ? ' item' : ' items'),
        items: o.items.map((it) => { const p = pById[it.id]; const coa = hasCOA(p); return { qty: it.qty, name: nameOf(it.id), mg: mgOf(it.id), lineStr: fmt(priceOf(it.id) * it.qty), hasCoa: coa, viewCoa: coa ? (() => router.push(`/verify?lot=${encodeURIComponent(p.lot)}`)) : null }; }),
        subtotalStr: fmt(orderTotal(o)), totalStr: fmt(orderTotal(o)),
        method: 'Cold-pack express · 2-day', carrier: (o.status === 'Shipped' ? 'UPS' : 'Assigned at dispatch'),
        tracking: (o.status === 'Shipped' ? ('1Z 999 AA1 01 2345 ' + (o.id.split('-').pop() || '0000')) : 'Awaiting dispatch'),
        name: o.customer, address: o.address,
      };
    }
  }

  const editLines = editItems.map((it) => ({ id: it.id, name: it.name, mg: it.mg, price: fmt(it.priceN), qty: it.qty, lineStr: fmt(it.priceN * it.qty), inc: () => editInc(it.id), dec: () => editDec(it.id), remove: () => editRemove(it.id) }));
  const editTotal = editItems.reduce((a, it) => a + it.priceN * it.qty, 0);
  const editCatalog = products.map((p, i) => {
    const inO = editItems.find((it) => it.id === p.id); const out = p.stock <= 0;
    return {
      id: p.id, name: p.name, mg: p.mg, price: fmt(p.price),
      rowStyle: `display:flex;align-items:center;gap:10px;padding:10px 14px;` + (out ? `cursor:default;opacity:.55;` : `cursor:pointer;`) + (i > 0 ? `border-top:1px solid rgba(45,53,39,.07);` : ''),
      addLabel: out ? 'Out' : (inO ? 'Added · ' + inO.qty : '+ Add'),
      addStyle: `flex:none;font:600 11px 'Manrope',sans-serif;` + (out ? `color:#8B947E;` : (inO ? `color:#3E7C5B;` : `color:#5A6B4B;`)),
      add: out ? (() => {}) : (() => editAdd(p.id)),
    };
  });

  const proofOrder = orders.find((x) => x.id === proofId);
  const proofReceipt = proofOrder
    ? { ref: proofOrder.id, file: proofOrder.proof || 'receipt.pdf', amount: fmt(orderTotal(proofOrder)), date: longDate(proofOrder.placed), payer: proofOrder.customer, bank: 'First Coastal Bank · Wire transfer' }
    : { ref: '', file: '', amount: '', date: '', payer: '', bank: '' };

  const submitOrderStyle = `display:block;text-align:center;margin-top:16px;font:600 13px 'Manrope',sans-serif;padding:14px;border-radius:999px;transition:all .2s ease;` + (proofName ? `color:#FFFFFF;background:#9EAF8B;cursor:pointer;` : `color:rgba(255,255,255,.9);background:#9EAF8B;opacity:.4;cursor:not-allowed;`);
  const editSaveStyle = `display:block;text-align:center;margin-top:16px;font:600 13px 'Manrope',sans-serif;padding:14px;border-radius:999px;transition:all .2s ease;` + (editItems.length ? `color:#FFFFFF;background:#9EAF8B;cursor:pointer;` : `color:rgba(255,255,255,.9);background:#9EAF8B;opacity:.4;cursor:not-allowed;`);
  const npCreateStyle = `display:block;text-align:center;margin-top:4px;font:600 13px 'Manrope',sans-serif;padding:14px;border-radius:999px;transition:all .2s ease;` + ((npName.trim() && npPrice.trim() && npLot.trim() && !npBusy) ? `color:#FFFFFF;background:#9EAF8B;cursor:pointer;` : `color:rgba(255,255,255,.9);background:#9EAF8B;opacity:.4;cursor:not-allowed;`);

  const v = {
    // layout / nav
    isMobile, viewAs, dashView, dashNav, goHome, goContact, logout, role, isAdmin,
    setCustomer, setAdmin, goCustCatalog, goCustOrders, goAdmOrders, goAdmInventory, goAccount, backToOrders,
    drawerCustCatalog, drawerCustOrders, drawerAdmOrders, drawerAdmInventory, drawerAccount,
    toggleDashNav, closeDashNav,
    dbarTop: `position:absolute;left:0;width:22px;height:1.6px;background:#FFFFFF;border-radius:1px;transition:transform .3s ease, top .3s ease;` + (dashNav ? `top:6px;transform:rotate(45deg);` : `top:3px;`),
    dbarBot: `position:absolute;left:0;width:22px;height:1.6px;background:#FFFFFF;border-radius:1px;transition:transform .3s ease, top .3s ease;` + (dashNav ? `top:6px;transform:rotate(-45deg);` : `top:10px;`),
    sideCustCatalog: sideStyle(dashView === 'catalog'),
    sideCustOrders: sideStyle(dashView === 'myorders' || dashView === 'orderdetail'),
    sideAccount: sideStyle(dashView === 'account'),
    sideAdmOrders: sideStyle(dashView === 'orders'),
    sideAdmInventory: sideStyle(dashView === 'inventory'),
    mtabCatalog: mtabStyle(viewAs === 'customer' && dashView === 'catalog'),
    mtabOrders: mtabStyle(viewAs === 'customer' && (dashView === 'myorders' || dashView === 'orderdetail')),
    mtabAccount: mtabStyle(viewAs === 'customer' && dashView === 'account'),
    mtabAdmOrders: mtabStyle(viewAs === 'admin' && dashView === 'orders'),
    mtabAdmInventory: mtabStyle(viewAs === 'admin' && dashView === 'inventory'),
    authName: account.name, authInitial: initials(account.name),

    // catalog
    dashSearch, onDashSearch: (e) => setDashSearch(e.target.value),
    dashList, dashCount: dashList.length, dashEmpty: dashList.length === 0,

    // my orders
    myOrders, myOrdersEmpty: myOrders.length === 0, myOrderGroups,
    detailOrder: detailOrder || {}, hasDetail: !!detailOrder,

    // account
    acctName, acctEmail, acctOrg, acctAddr, acctCity, acctState, acctZip, acctCountry, acctPwCur, acctPwNew, acctPwConf,
    onAcctName: (e) => setAcctName(e.target.value), onAcctEmail: (e) => setAcctEmail(e.target.value), onAcctOrg: (e) => setAcctOrg(e.target.value),
    onAcctAddr: (e) => setAcctAddr(e.target.value), onAcctCity: (e) => setAcctCity(e.target.value), onAcctState: (e) => setAcctState(e.target.value),
    onAcctZip: (e) => setAcctZip(e.target.value), onAcctCountry: (e) => setAcctCountry(e.target.value),
    onAcctPwCur: (e) => setAcctPwCur(e.target.value), onAcctPwNew: (e) => setAcctPwNew(e.target.value), onAcctPwConf: (e) => setAcctPwConf(e.target.value),
    saveAccount, acctBusy,

    // admin orders
    ordersList,
    statOpen: orders.filter((o) => o.status === 'Processing').length,
    statShipped: orders.filter((o) => o.status === 'Shipped').length,
    statCancelled: orders.filter((o) => o.status === 'Cancelled').length,
    statRevenue: '$' + orders.filter((o) => o.status !== 'Cancelled').reduce((a, o) => a + orderTotal(o), 0).toLocaleString('en-US'),

    // inventory
    invList, statSkus: products.length, totalUnits, lowCount, openNewPeptide,

    // cart popup
    cartCount, cartHasItems: cartCount > 0, cartEmpty: cartCount === 0, cartLines, cartSubtotalStr: fmt(cartSubtotal), cartOpen,
    isCartStep: checkoutStep === 'cart', isShipStep: checkoutStep === 'shipping', isPaymentStep: checkoutStep === 'payment', isDoneStep: checkoutStep === 'done',
    inCheckoutFlow: ['cart', 'shipping', 'payment'].includes(checkoutStep) && cartCount > 0,
    stepProgressLabel: checkoutStep === 'cart' ? 'Step 1 of 3 · Cart' : (checkoutStep === 'shipping' ? 'Step 2 of 3 · Shipping' : 'Step 3 of 3 · Payment'),
    stepFillStyle: `height:100%;border-radius:999px;background:#9EAF8B;transition:width .35s cubic-bezier(.2,.7,.2,1);width:` + (checkoutStep === 'cart' ? '33%' : (checkoutStep === 'shipping' ? '66%' : '100%')),
    checkoutTitle: checkoutStep === 'cart' ? 'Your cart' : (checkoutStep === 'shipping' ? 'Shipping details' : (checkoutStep === 'payment' ? 'Payment' : 'Order confirmed')),
    openCart, closeCart, goShipping, goPayment, backToCart, backToShipping,
    coName, coAddr, coCity, coState, coZip,
    onCoName: (e) => setCoName(e.target.value), onCoAddr: (e) => setCoAddr(e.target.value), onCoCity: (e) => setCoCity(e.target.value), onCoState: (e) => setCoState(e.target.value), onCoZip: (e) => setCoZip(e.target.value),
    noProof: !proofName, hasProof: !!proofName, proofName, onProofFile, clearProof,
    submitOrderStyle, submitOrder, simulatePayment, lastOrderId, doneGoOrders,

    // cancel modal
    cancelOpen: !!cancelId, cancelOrderId: cancelId, cancelReason, cancelMsg,
    onCancelReason: (e) => setCancelReason(e.target.value), onCancelMsg: (e) => setCancelMsg(e.target.value),
    cancelConfirm, cancelKeep,

    // edit order modal
    editOpen, editId, editLines, editCatalog, editEmpty: editItems.length === 0, editTotalStr: fmt(editTotal),
    editName, editAddr, onEditName: (e) => setEditName(e.target.value), onEditAddr: (e) => setEditAddr(e.target.value),
    closeEdit, saveEdit, editSaveStyle,

    // new peptide modal
    npOpen, closeNp, npName, npSub, npMg, npPrice, npStock, npLot, npBusy,
    npCat, npCats: CATEGORIES, setNpCat: (cat) => setNpCat(cat),
    onNpName: (e) => setNpName(e.target.value), onNpSub: (e) => setNpSub(e.target.value), onNpMg: (e) => setNpMg(e.target.value),
    onNpPrice: (e) => setNpPrice(e.target.value), onNpStock: (e) => setNpStock(e.target.value), onNpLot: (e) => setNpLot(e.target.value),
    createPeptide, npCreateStyle,

    // edit inventory modal
    editInvOpen, editInvName, editInvStock, editInvLot, editInvHasCoa, invBusy,
    onEditInvStock: (e) => setEditInvStock(e.target.value), onEditInvLot: (e) => setEditInvLot(e.target.value),
    saveEditInv, closeEditInv,

    // proof modal
    showProof: !!proofId, proofReceipt, closeProof: () => setProofId(null),

    stopProp,
  };

  return <PortalContext.Provider value={v}>{children}</PortalContext.Provider>;
}
