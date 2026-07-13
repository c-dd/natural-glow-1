'use client';

const LABEL = "font:500 9px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#78826B;margin-bottom:5px";
const INPUT = "width:100%;font:500 13.5px 'Manrope',sans-serif;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.13);border-radius:10px;padding:11px 12px";
const INPUT_MONO = "width:100%;font:500 13.5px 'Space Mono',monospace;letter-spacing:.04em;color:#2E3627;background:#fff;border:1.5px solid rgba(45,53,39,.13);border-radius:10px;padding:11px 12px;text-transform:uppercase";

// parse a css-declaration string into a React style object (mirrors lib/style)
import { parseStyle } from '@/lib/style';

export function Field({ label, value, onChange, placeholder, type = 'text', mono = false, wrapStyle }) {
  return (
    <div style={wrapStyle}>
      <div style={parseStyle(LABEL)}>{label}</div>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={parseStyle(mono ? INPUT_MONO : INPUT)} />
    </div>
  );
}

export function Area({ label, value, onChange, placeholder, rows = 2 }) {
  return (
    <div>
      <div style={parseStyle(LABEL)}>{label}</div>
      <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={{ ...parseStyle(INPUT), resize: 'vertical' }} />
    </div>
  );
}
