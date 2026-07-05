'use client';

import { useState } from 'react';
import { Box } from '@/components/Box';
import { useGate, writeGate, useMobile } from '@/lib/store';

// RUO age/use gate, ported 1:1 from the original single-file app.
// While not entered, a full-screen overlay is shown and the page behind is
// blurred + made non-interactive. Persists the pass via writeGate(true).
// useGate() returns null before hydration → render children unblurred and NO
// overlay until hydrated (avoids an SSR flash / mismatch).

const chk = (on) =>
  'flex:none;width:19px;height:19px;border-radius:5px;display:grid;place-items:center;font-size:11px;margin-top:1px;transition:all .15s ease;' +
  (on
    ? 'background:#14161A;color:#fff;border:1.5px solid #14161A;'
    : 'background:transparent;color:transparent;border:1.5px solid rgba(20,22,26,.35);');

const ENTER_BASE =
  "flex:1;text-align:center;font:600 13px 'Manrope',sans-serif;padding:13px;border-radius:999px;transition:all .2s ease;";

export default function Gate({ children }) {
  const entered = useGate(); // null (pre-hydration) | true | false
  const mobile = useMobile();
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [tried, setTried] = useState(false);
  const [left, setLeft] = useState(false);

  const hydrated = entered !== null;
  const gateUp = hydrated && !entered && !left;
  const exitUp = hydrated && !entered && left;
  const both = c1 && c2;
  const showHint = gateUp && tried && !both;
  const showReset = hydrated && !(mobile && entered === true);

  const wrap =
    'transition:filter .55s ease, opacity .55s ease;' +
    (gateUp ? 'filter:blur(3px);opacity:.92;pointer-events:none;' : 'filter:none;opacity:1;');

  const enter = () => {
    if (!(c1 && c2)) { setTried(true); return; }
    writeGate(true);
  };
  const leave = () => setLeft(true);
  const backToGate = () => { setLeft(false); setTried(false); };
  const reset = () => { writeGate(false); setLeft(false); setC1(false); setC2(false); setTried(false); };

  const enterStyle =
    ENTER_BASE +
    (both
      ? 'color:#fff;background:#14161A;cursor:pointer;'
      : 'color:rgba(255,255,255,.9);background:#14161A;opacity:.4;cursor:not-allowed;');

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#F5F3ED' }}>
      <Box as="div" style={wrap}>{children}</Box>

      {/* ============ AGE / RUO GATE ============ */}
      {gateUp && (
        <Box as="div" style="position:fixed;inset:0;background:rgba(20,22,26,.42);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:80;padding:20px">
          <Box as="div" style="width:448px;max-width:100%;background:#F7F5EF;border:1px solid rgba(20,22,26,.13);border-radius:16px;padding:36px 36px 30px;box-shadow:0 44px 90px -30px rgba(20,22,26,.65);animation:ngPop .45s cubic-bezier(.2,.7,.2,1)">
            <Box as="div" style="display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:24px">
              <img src="/ng-mark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
              <Box as="span" style="font:500 7px 'Space Mono',monospace;letter-spacing:.1em;color:#96702E;border:1px solid rgba(150,112,46,.5);padding:2px 4px;border-radius:3px">RUO</Box>
            </Box>
            <Box as="div" style="font:500 10px 'Space Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:#96702E;text-align:center">Age &amp; use verification</Box>
            <Box as="h2" style="margin:10px 0 0;font:300 31px/1.1 'Spectral',serif;text-align:center">For research use only</Box>
            <Box as="p" style="margin:14px 0 0;font:400 12.5px/1.65 'Manrope',sans-serif;color:#4E545B;text-align:center;text-wrap:pretty">The products on this site are sold strictly as reference materials for laboratory and research purposes. They are not drugs, cosmetics, or foods, and are not for human or animal consumption.</Box>
            <Box as="div" style="margin-top:22px;display:flex;flex-direction:column;gap:12px">
              <Box as="div" onClick={() => setC1((v) => !v)} style="display:flex;align-items:flex-start;gap:11px;cursor:pointer;user-select:none">
                <Box as="span" style={chk(c1)}>{c1 ? '✓' : ''}</Box>
                <Box as="span" style="font:500 12px/1.45 'Manrope',sans-serif;color:#3A3F45">I am at least 21 years of age.</Box>
              </Box>
              <Box as="div" onClick={() => setC2((v) => !v)} style="display:flex;align-items:flex-start;gap:11px;cursor:pointer;user-select:none">
                <Box as="span" style={chk(c2)}>{c2 ? '✓' : ''}</Box>
                <Box as="span" style="font:500 12px/1.45 'Manrope',sans-serif;color:#3A3F45">I confirm these products are for research use only, not for human consumption.</Box>
              </Box>
            </Box>
            <Box as="div" style="display:flex;gap:12px;margin-top:26px">
              <Box as="span" onClick={enter} style={enterStyle}>Enter site</Box>
              <Box as="span" onClick={leave} style="flex:none;text-align:center;font:600 13px 'Manrope',sans-serif;color:#5A5F64;border:1px solid rgba(20,22,26,.2);padding:13px 22px;border-radius:999px;cursor:pointer;user-select:none;transition:border-color .2s ease" hover="border-color:rgba(20,22,26,.45)">Leave</Box>
            </Box>
            {showHint && (
              <Box as="p" style="margin:12px 0 0;font:500 11px 'Manrope',sans-serif;color:#B07A24;text-align:center">Please confirm both statements to continue.</Box>
            )}
            <Box as="p" style="margin:18px 0 0;font:400 9.5px/1.6 'Space Mono',monospace;color:#8A8F95;text-align:center">These statements have not been evaluated by the FDA. Products are not intended to diagnose, treat, cure, or prevent any disease.</Box>
          </Box>
        </Box>
      )}

      {/* ============ EXIT ============ */}
      {exitUp && (
        <Box as="div" style="position:fixed;inset:0;background:#14161A;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:90;padding:24px;text-align:center;animation:ngFade .4s ease">
          <Box as="div" style="display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:28px">
            <img src="/ng-mark-dark.png" alt="Natural Glow" style={{ width: 125, height: 'auto', display: 'block' }} />
            <Box as="span" style="font:500 7px 'Space Mono',monospace;letter-spacing:.1em;color:#C9A15E;border:1px solid rgba(201,161,94,.6);padding:2px 4px;border-radius:3px">RUO</Box>
          </Box>
          <Box as="h2" style="margin:0;font:300 36px/1.15 'Spectral',serif;color:#F5F3ED">Access not granted</Box>
          <Box as="p" style="margin:14px 0 0;max-width:400px;font:400 13px/1.7 'Manrope',sans-serif;color:#A7ADB3">This site is restricted to verified researchers 21 and older. You may return if your details have changed.</Box>
          <Box as="span" onClick={backToGate} style="margin-top:28px;font:600 13px 'Manrope',sans-serif;color:#14161A;background:#F5F3ED;padding:14px 28px;border-radius:999px;cursor:pointer;user-select:none;transition:all .2s ease" hover="transform:translateY(-1px)">Return to verification</Box>
        </Box>
      )}

      {/* demo reset */}
      {showReset && (
        <Box as="div" onClick={reset} style="position:fixed;right:16px;bottom:16px;z-index:95;font:500 10px 'Space Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#5A5F64;background:rgba(255,255,255,.92);border:1px solid rgba(20,22,26,.15);padding:8px 13px;border-radius:999px;cursor:pointer;user-select:none;box-shadow:0 4px 14px rgba(20,22,26,.12);transition:color .2s ease" hover="color:#14161A">↺ Reset gate</Box>
      )}
    </div>
  );
}
