// Parses a CSS declaration string ("color:#211b12;font-size:14px") into a
// React style object ({ color: '#211b12', fontSize: '14px' }).
// This lets us copy the exact inline-style strings from the original design
// verbatim, guaranteeing a pixel-perfect match with zero hand-translation.
export function parseStyle(str) {
  if (!str || typeof str !== 'string') return {};
  const out = {};
  // Split on ';' but not inside parentheses (gradients, url(), etc.)
  let depth = 0;
  let buf = '';
  const rules = [];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      rules.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) rules.push(buf);

  for (const rule of rules) {
    const idx = rule.indexOf(':');
    if (idx < 0) continue;
    const rawKey = rule.slice(0, idx).trim();
    const value = rule.slice(idx + 1).trim();
    if (!rawKey) continue;
    // Preserve CSS custom properties (--foo) as-is; camelCase the rest.
    const key = rawKey.startsWith('--')
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = value;
  }
  return out;
}

// Merge several style strings/objects into one React style object.
export function mergeStyle(...parts) {
  return parts.reduce((acc, p) => {
    if (!p) return acc;
    return Object.assign(acc, typeof p === 'string' ? parseStyle(p) : p);
  }, {});
}
