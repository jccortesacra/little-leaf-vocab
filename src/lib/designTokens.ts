// Design System Tokens for Little-Leaf
// Based on PRD Phase 1 requirements

export const colors = {
  primary: 'hsl(213, 53%, 25%)', // #244a7c
  success: 'hsl(152, 69%, 36%)', // #1e9e63
  warning: 'hsl(43, 96%, 44%)', // #e0a800
  danger: 'hsl(0, 63%, 55%)', // #d64545
  surface: 'hsl(0, 0%, 100%)', // #ffffff
  surfaceSubtle: 'hsl(213, 30%, 97%)', // #f6f8fb
  text: 'hsl(213, 55%, 10%)', // #122033
  textMuted: 'hsl(213, 19%, 45%)', // #65738a
};

export const typography = {
  h1: { size: '2rem', lineHeight: '2.5rem', weight: '700' }, // 32px
  h2: { size: '1.5rem', lineHeight: '2rem', weight: '600' }, // 24px
  h3: { size: '1.25rem', lineHeight: '1.75rem', weight: '600' }, // 20px
  body: { size: '1rem', lineHeight: '1.5rem', weight: '400' }, // 16px
  bodyLarge: { size: '1.125rem', lineHeight: '1.75rem', weight: '400' }, // 18px
  caption: { size: '0.875rem', lineHeight: '1.25rem', weight: '400' }, // 14px
  small: { size: '0.75rem', lineHeight: '1rem', weight: '400' }, // 12px
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
};

export const borderRadius = {
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
};

// Touch target minimum for mobile accessibility
export const touchTarget = {
  minHeight: '44px',
  minWidth: '44px',
};
