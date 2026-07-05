'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readAuth } from '@/lib/store';
import Toasts from '@/components/Toast';
import { PortalProvider } from '@/components/portal/PortalContext';
import Dashboard from '@/components/portal/Dashboard';

// Self-contained full-viewport portal. Auth guard runs after hydration:
// if not signed in, redirect to /signin; render nothing until confirmed.
export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok'

  useEffect(() => {
    if (readAuth()) setStatus('ok');
    else router.replace('/signin');
  }, [router]);

  if (status !== 'ok') return null;

  return (
    <PortalProvider>
      <Dashboard />
      <Toasts />
    </PortalProvider>
  );
}
