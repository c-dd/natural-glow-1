'use client';

import { usePortal } from './PortalContext';
import {
  useProductsStatus, useOrdersStatus, useAdminOrdersStatus,
  refreshProducts, refreshOrders, refreshAdminOrders,
} from '@/lib/store';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { CatalogView, MyOrdersView, OrderDetailView, AccountView } from './CustomerViews';
import { AdminOrdersView, InventoryView } from './AdminViews';
import { CartPopup, CancelModal, EditOrderModal, NewPeptideModal, EditInventoryModal, ProofModal } from './Modals';

// Slim loading/error strip fed by the products + orders resource status. Shows
// only while first-loading or on error; silent once everything is live.
function StatusStrip() {
  const v = usePortal();
  const isAdminView = v.viewAs === 'admin';
  const prod = useProductsStatus();
  const custOrders = useOrdersStatus(!isAdminView);
  const admOrders = useAdminOrdersStatus(isAdminView);
  const ord = isAdminView ? admOrders : custOrders;

  const loading = !prod.loaded || !ord.loaded;
  const error = prod.error || ord.error;
  if (!loading && !error) return null;

  const retry = () => { refreshProducts(); if (isAdminView) refreshAdminOrders(); else refreshOrders(); };
  const base = { padding: '9px 20px', font: "500 11.5px 'Manrope',sans-serif", display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' };

  if (error) {
    return (
      <div style={{ ...base, background: 'rgba(168,68,46,.08)', color: '#A8442E', borderBottom: '1px solid rgba(168,68,46,.2)' }}>
        <span>Couldn’t reach the server — your view may be out of date.</span>
        <span onClick={retry} style={{ cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Retry</span>
      </div>
    );
  }
  return (
    <div style={{ ...base, background: 'rgba(90,107,75,.08)', color: '#5A6B4B', borderBottom: '1px solid rgba(90,107,75,.15)' }}>
      <span>Loading your latest data…</span>
    </div>
  );
}

function CurrentView() {
  const v = usePortal();
  if (v.viewAs === 'customer') {
    if (v.dashView === 'catalog') return <CatalogView />;
    if (v.dashView === 'myorders') return <MyOrdersView />;
    if (v.dashView === 'orderdetail') return v.hasDetail ? <OrderDetailView /> : <MyOrdersView />;
    if (v.dashView === 'account') return <AccountView />;
    return <CatalogView />;
  }
  if (v.dashView === 'inventory') return <InventoryView />;
  return <AdminOrdersView />;
}

export default function Dashboard() {
  return (
    <>
      <div className="ng-dash" style={{ display: 'grid', gridTemplateColumns: '236px 1fr', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ background: '#FFDFE0', minWidth: 0 }}>
          <MobileNav />
          <StatusStrip />
          <CurrentView />
        </div>
      </div>

      <CartPopup />
      <CancelModal />
      <EditOrderModal />
      <NewPeptideModal />
      <EditInventoryModal />
      <ProofModal />
    </>
  );
}
