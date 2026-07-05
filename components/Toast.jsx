'use client';

import { useEffect, useState } from 'react';

// Bottom-center toast pill, ported from the original design.
// Fire from anywhere: toast('Message') — optionally toast('Msg', { label: 'View cart →', onClick }).
let fire = null;
export function toast(msg, action) {
  if (fire) fire({ msg, action });
}

export default function Toasts() {
  const [t, setT] = useState(null);
  useEffect(() => {
    fire = (v) => {
      setT(v);
      clearTimeout(fire._to);
      fire._to = setTimeout(() => setT(null), 3200);
    };
    return () => { fire = null; };
  }, []);
  if (!t) return null;
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 200, display: 'flex', alignItems: 'center', gap: 14, background: '#14161A', color: '#F5F3ED', padding: '13px 22px', borderRadius: 999, boxShadow: '0 10px 30px rgba(20,22,26,.3)', font: "500 13px 'Manrope',sans-serif", whiteSpace: 'nowrap', animation: 'ngRise .3s cubic-bezier(.2,.7,.2,1)' }}>
      <span>{t.msg}</span>
      {t.action && (
        <span onClick={() => { t.action.onClick?.(); setT(null); }} style={{ color: '#C9A15E', cursor: 'pointer', fontWeight: 600 }}>
          {t.action.label}
        </span>
      )}
    </div>
  );
}
