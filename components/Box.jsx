'use client';

import { useState } from 'react';
import { parseStyle } from '@/lib/style';

// <Box> renders any element from a verbatim inline-style string, plus optional
// hover / active / focus style strings (CSS pseudo-states can't be inline).
// This mirrors the original design components' style="" + style-hover="" model
// so the markup translates 1:1 and matches perfectly.
//
//   <Box as="a" href="/verify" style="color:#2E3627" hover="opacity:.85">Verify</Box>
//
export function Box({
  as = 'div',
  style = '',
  hover = '',
  active = '',
  focus = '',
  children,
  ...rest
}) {
  const Tag = as;
  const [h, setH] = useState(false);
  const [a, setA] = useState(false);
  const [f, setF] = useState(false);

  const merged = {
    ...parseStyle(style),
    ...(h && hover ? parseStyle(hover) : {}),
    ...(a && active ? parseStyle(active) : {}),
    ...(f && focus ? parseStyle(focus) : {}),
  };

  const handlers = {};
  if (hover || active) {
    handlers.onMouseEnter = (e) => { if (hover) setH(true); rest.onMouseEnter?.(e); };
    handlers.onMouseLeave = (e) => { setH(false); setA(false); rest.onMouseLeave?.(e); };
  }
  if (active) {
    handlers.onMouseDown = (e) => { setA(true); rest.onMouseDown?.(e); };
    handlers.onMouseUp = (e) => { setA(false); rest.onMouseUp?.(e); };
  }
  if (focus) {
    handlers.onFocus = (e) => { setF(true); rest.onFocus?.(e); };
    handlers.onBlur = (e) => { setF(false); rest.onBlur?.(e); };
  }

  // Don't double-bind handlers we wrapped above.
  const { onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, onFocus, onBlur, ...passthrough } = rest;

  return (
    <Tag style={merged} {...handlers} {...passthrough}>
      {children}
    </Tag>
  );
}

export default Box;
