import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:    { DEFAULT: '#0A0A0F', card: '#111118', term: '#0D0D0D' },
        ink:   { DEFAULT: '#FFFFFF', body: '#E8E8E8', muted: '#999999', subtle: '#666666', hint: '#333333' },
        crimson:   '#DC143C',
        termgreen: '#4AF626',
      },
      fontFamily: { mono: ['var(--font-fira)', 'monospace'] },
      letterSpacing: { label: '0.2em', wide3: '0.3em' },
      keyframes: {
        blink: { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
        pulse2: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        bob:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(6px)' } },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        pulse2: 'pulse2 2s ease-in-out infinite',
        bob:   'bob 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
