'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { me } from '@/lib/store';
import Toasts from '@/components/Toast';
import { PortalProvider } from '@/components/portal/PortalContext';
import Dashboard from '@/components/portal/Dashboard';

// Self-contained full-viewport portal. Auth guard runs after hydration: it
// confirms the session against GET /api/auth/me (cookie-backed) — a stale
// localStorage hint can never grant access. Not signed in -> /signin. Render
// nothing until the API resolves.
export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok'

  useEffect(() => {
    let alive = true;
    me()
      .then((user) => {
        if (!alive) return;
        if (user) setStatus('ok');
        else router.replace('/signin');
      })
      .catch(() => { if (alive) router.replace('/signin'); });
    return () => { alive = false; };
  }, [router]);

  if (status !== 'ok') return null;

  return (
    <PortalProvider>
      <Dashboard />
      <Toasts />
    </PortalProvider>
  );
}
