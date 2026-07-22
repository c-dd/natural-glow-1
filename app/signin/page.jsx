'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/Box';
import Gate from '@/components/Gate';
import Toasts from '@/components/Toast';
import { signup, login } from '@/lib/store';

const tabStyle = (on) =>
  "flex:1;text-align:center;font:600 12px 'Manrope',sans-serif;padding:9px;border-radius:999px;cursor:pointer;" +
  (on ? 'background:rgba(255,255,255,.22);color:#FFFFFF;box-shadow:0 1px 3px rgba(45,53,39,.1)' : 'background:transparent;color:rgba(255,255,255,.75)');

const inputStyle =
  "width:100%;font:500 14px 'Manrope',sans-serif;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.13);border-radius:10px;padding:12px 13px";
const labelStyle =
  "font:500 10px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#78826B;margin-bottom:6px";

// Map a server error code to human copy.
function errorCopy(err, mode) {
  const code = err && err.code;
  switch (code) {
    case 'EMAIL_EXISTS':
      return 'An account with that email already exists. Try signing in instead.';
    case 'INVALID_CREDENTIALS':
    case 'unauthenticated':
      return 'Incorrect email or password.';
    case 'LOCKED':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    case 'validation_failed':
      return mode === 'signup'
        ? 'Check your details — a name, a valid email, and an 8+ character password are required.'
        : 'Enter a valid email and password.';
    case 'network_error':
      return 'Network error — please check your connection and try again.';
    default:
      return (err && err.message) || 'Something went wrong. Please try again.';
  }
}

export default function SigninPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (m) => { setMode(m); setError(''); };

  const doAuth = async () => {
    if (busy) return;
    setError('');
    const em = (email || '').trim();
    if (!em || !password) { setError('Enter your email and password.'); return; }
    if (mode === 'signup') {
      if (!name.trim()) { setError('Enter your name.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signup({ name: name.trim(), email: em, password });
      else await login({ email: em, password });
      router.push('/dashboard');
    } catch (err) {
      setError(errorCopy(err, mode));
      setBusy(false);
    }
  };

  const onKeyDown = (e) => { if (e.key === 'Enter') doAuth(); };

  const submitLabel = busy
    ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
    : (mode === 'signin' ? 'Sign in' : 'Create account');

  return (
    <>
      <Gate>
        <Box as="div" className="ng-auth">
          {/* brand */}
          <Box as="div" className="ng-auth-brand" style="position:relative;background:#9EAF8B;display:flex;flex-direction:column;justify-content:space-between;padding:48px 50px;overflow:hidden">
            <Box as="div" style="position:absolute;inset:0;background-image:linear-gradient(rgba(185,111,116,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(185,111,116,.06) 1px,transparent 1px);background-size:46px 46px" />
            <Box as="div" style="position:absolute;left:-80px;bottom:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(185,111,116,.14),transparent 65%)" />
            <Box as="div" onClick={() => router.push('/')} style="position:relative;display:flex;align-items:center;gap:9px;cursor:pointer">
              <img src="/ng-mark-dark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
              <Box as="span" style="font:500 8px 'Space Mono',monospace;letter-spacing:.1em;color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.5);padding:2px 5px;border-radius:3px">RUO</Box>
            </Box>
            <Box as="div" style="position:relative">
              <Box as="h2" style="margin:0;font:300 clamp(32px,3.2vw,44px)/1.18 'Spectral',serif;color:#FFFFFF;max-width:440px">High-quality, <span style={{ fontStyle: 'italic', color: '#FFFFFF' }}>research-grade</span> peptides.</Box>
              <Box as="p" style="margin:18px 0 0;max-width:400px;font:400 13.5px/1.75 'Manrope',sans-serif;color:rgba(255,255,255,.75)">Sign in to browse the catalog, place orders, and pull a Certificate of Analysis for any lot.</Box>
            </Box>
            <Box as="div" style="position:relative;font:400 10px/1.7 'Space Mono',monospace;color:rgba(255,255,255,.6);max-width:440px">For Research Use Only. Not for human or animal consumption.</Box>
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
              <Box as="div" style="display:flex;background:#9EAF8B;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:3px;margin-bottom:24px">
                <Box as="span" onClick={() => switchMode('signin')} style={tabStyle(mode === 'signin')}>Sign in</Box>
                <Box as="span" onClick={() => switchMode('signup')} style={tabStyle(mode === 'signup')}>Sign up</Box>
              </Box>
              {mode === 'signup' && (
                <Box as="div" style="margin-bottom:14px">
                  <Box as="div" style={labelStyle}>Name</Box>
                  <Box as="input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKeyDown} placeholder="Dr. Jane Okafor" style={inputStyle} />
                </Box>
              )}
              <Box as="div" style="margin-bottom:14px">
                <Box as="div" style={labelStyle}>Email</Box>
                <Box as="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKeyDown} placeholder="jane@lab.edu" style={inputStyle} />
              </Box>
              <Box as="div" style="margin-bottom:20px">
                <Box as="div" style={labelStyle}>Password</Box>
                <Box as="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} style={inputStyle} />
                {mode === 'signin' && (
                  <Box as="div" style="text-align:right;font:400 11px 'Manrope',sans-serif;color:#78826B;margin-top:10px">
                    Trouble signing in? <Box as="a" href="mailto:support@caredigitalcareers.com" style="color:#5A6B4B;text-decoration:none;font-weight:600">Contact support</Box>
                  </Box>
                )}
              </Box>
              {error && (
                <Box as="div" role="alert" style="margin:0 0 16px;font:500 12px/1.5 'Manrope',sans-serif;color:#A8442E;background:rgba(168,68,46,.08);border:1px solid rgba(168,68,46,.28);border-radius:10px;padding:10px 12px">{error}</Box>
              )}
              <Box as="span" onClick={doAuth} aria-disabled={busy} style={`display:block;text-align:center;font:600 13px 'Manrope',sans-serif;color:#FFFFFF;background:#9EAF8B;padding:14px;border-radius:999px;transition:all .2s ease;` + (busy ? 'opacity:.6;cursor:progress' : 'cursor:pointer')} hover={busy ? '' : 'background:#8A9E76;transform:translateY(-1px)'}>{submitLabel}</Box>
            </Box>
          </Box>
        </Box>
      </Gate>
      <Toasts />
    </>
  );
}
