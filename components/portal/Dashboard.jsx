'use client';

import { usePortal } from './PortalContext';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { CatalogView, MyOrdersView, OrderDetailView, AccountView } from './CustomerViews';
import { AdminOrdersView, InventoryView } from './AdminViews';
import { CartPopup, CancelModal, EditOrderModal, NewPeptideModal, EditInventoryModal, ProofModal } from './Modals';

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
        <div style={{ background: '#EFECE4', minWidth: 0 }}>
          <MobileNav />
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
