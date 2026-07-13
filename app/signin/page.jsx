'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Toasts, { toast } from '@/components/Toast';
import { writeAccount, writeAuth } from '@/lib/store';

const tabStyle = (on) =>
  "flex:1;text-align:center;font:600 12px 'Manrope',sans-serif;padding:9px;border-radius:999px;cursor:pointer;" +
  (on ? 'background:#fff;color:#2E3627;box-shadow:0 1px 3px rgba(45,53,39,.1)' : 'background:transparent;color:#78826B');

export default function SigninPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const doAuth = () => {
    const em = email || '';
    const derived = em.includes('@')
      ? em.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Researcher';
    const finalName = (mode === 'signup' && name.trim()) ? name.trim() : (derived || 'Researcher');
    writeAccount({ name: finalName, email: em });
    writeAuth(true);
    router.push('/dashboard');
  };

  return (
    <>
      <Gate>
        <Box as="div" className="ng-auth">
          {/* brand */}
          <Box as="div" className="ng-auth-brand" style="position:relative;background:#9EAF8B;display:flex;flex-direction:column;justify-content:space-between;padding:48px 50px;overflow:hidden">
            <Box as="div" style="position:absolute;inset:0;background-image:linear-gradient(rgba(185,111,116,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(185,111,116,.06) 1px,transparent 1px);background-size:46px 46px" />
            <Box as="div" style="position:absolute;left:-80px;bottom:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(185,111,116,.14),transparent 65%)" />
            <Box as="div" onClick={() => router.push('/')} style="position:relative;display:flex;align-items:center;gap:9px;cursor:pointer">
              <img src="/ng-mark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
              <Box as="span" style="font:500 8px 'Space Mono',monospace;letter-spacing:.1em;color:#5A6B4B;border:1px solid rgba(185,111,116,.5);padding:2px 5px;border-radius:3px">RUO</Box>
            </Box>
            <Box as="div" style="position:relative">
              <Box as="h2" style="margin:0;font:300 clamp(32px,3.2vw,44px)/1.18 'Spectral',serif;color:#2E3627;max-width:440px">High-quality, <span style={{ fontStyle: 'italic', color: '#5A6B4B' }}>research-grade</span> peptides.</Box>
              <Box as="p" style="margin:18px 0 0;max-width:400px;font:400 13.5px/1.75 'Manrope',sans-serif;color:#4A5540">Sign in to browse the catalog, place orders, and pull a Certificate of Analysis for any lot.</Box>
            </Box>
            <Box as="div" style="position:relative;font:400 10px/1.7 'Space Mono',monospace;color:#78826B;max-width:440px">For Research Use Only. Not for human or animal consumption.</Box>
          </Box>

          {/* form panel */}
          <Box as="div" className="ng-auth-panel" style="background:#FFDFE0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:46px 22px">
            <Box as="div" className="ng-auth-mobilelogo" onClick={() => router.push('/')} style="align-items:center;gap:8px;align-self:flex-start;margin:0 0 42px;cursor:pointer">
              <img src="/ng-mark.png" alt="Natural Glow" style={{ width: 104, height: 'auto', display: 'block' }} />
              <Box as="span" style="font:500 7px 'Space Mono',monospace;letter-spacing:.1em;color:#5A6B4B;border:1px solid rgba(90,107,75,.5);padding:2px 4px;border-radius:3px">RUO</Box>
            </Box>
            <Box as="div" className="ng-auth-form" style="width:320px;max-width:100%;animation:ngRise .5s cubic-bezier(.2,.7,.2,1)">
              <Box as="h1" style="margin:0 0 6px;font:300 31px 'Spectral',serif;color:#2E3627">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Box>
              <Box as="p" style="margin:0 0 24px;font:400 13px 'Manrope',sans-serif;color:#78826B">Access the research catalog and Certificates of Analysis.</Box>
              <Box as="div" style="display:flex;background:#FCE9EA;border:1px solid rgba(45,53,39,.09);border-radius:999px;padding:3px;margin-bottom:24px">
                <Box as="span" onClick={() => setMode('signin')} style={tabStyle(mode === 'signin')}>Sign in</Box>
                <Box as="span" onClick={() => setMode('signup')} style={tabStyle(mode === 'signup')}>Sign up</Box>
              </Box>
              {mode === 'signup' && (
                <Box as="div" style="margin-bottom:14px"><Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#78826B;margin-bottom:6px">Name</Box><Box as="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Okafor" style="width:100%;font:500 14px 'Manrope',sans-serif;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.13);border-radius:10px;padding:12px 13px" /></Box>
              )}
              <Box as="div" style="margin-bottom:14px"><Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#78826B;margin-bottom:6px">Email</Box><Box as="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@lab.edu" style="width:100%;font:500 14px 'Manrope',sans-serif;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.13);border-radius:10px;padding:12px 13px" /></Box>
              <Box as="div" style="margin-bottom:20px"><Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#78826B;margin-bottom:6px">Password</Box><Box as="input" type="password" placeholder="••••••••" style="width:100%;font:500 14px 'Manrope',sans-serif;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.13);border-radius:10px;padding:12px 13px" />{mode === 'signin' && (<Box as="div" className="ng-forgot" onClick={() => toast('Password reset link sent — check your email')} style="text-align:right;font:600 11.5px 'Manrope',sans-serif;color:#5A6B4B;cursor:pointer;margin-top:10px">Forgot password?</Box>)}</Box>
              <Box as="span" onClick={doAuth} style="display:block;text-align:center;font:600 13px 'Manrope',sans-serif;color:#2E3627;background:#9EAF8B;padding:14px;border-radius:999px;cursor:pointer;transition:all .2s ease" hover="background:#8A9E76;transform:translateY(-1px)">{mode === 'signin' ? 'Sign in' : 'Create account'}</Box>
              <Box as="p" style="margin:18px 0 0;text-align:center;font:400 10.5px/1.6 'Space Mono',monospace;color:#99A18C">Simulated access — any email and password will sign you in.</Box>
            </Box>
          </Box>
        </Box>
      </Gate>
      <Toasts />
    </>
  );
}
