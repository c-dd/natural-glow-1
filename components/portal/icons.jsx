'use client';

// Inline SVG icons ported verbatim from the original design source.
export const Cart = ({ s = 18, c = '#2E3627', w = 1.7 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h2.2l2.1 12.3a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.3L21 7H5.2" />
  </svg>
);

export const ChevR = ({ s = 14, c = '#B96F74', w = 1.6 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ChevL = ({ s = 14, c = '#5A6B4B', w = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const Search = ({ s = 15, c = '#99A18C', w = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);

export const FileIcon = ({ s = 14, c = '#4A5540', w = 1.7 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3v5h5" />
    <path d="M18 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2Z" />
  </svg>
);

export const Upload = ({ s = 22, c = '#5A6B4B', w = 1.6 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16V4" />
    <path d="M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);

export const CheckMark = ({ s = 26, c = '#3E7C5B', w = 1.7 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
