import type { Config } from 'tailwindcss';

// All brand colours live in CSS variables (app/globals.css) so they can be
// changed in one place. Tailwind reads them through rgb(var(--x) / <alpha>).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', md: '2rem' }, screens: { '2xl': '1240px' } },
    extend: {
      colors: {
        page: v('page'),
        tint: v('tint'),
        primary: v('primary'),
        accent: v('accent'),
        glow: v('glow'),
        navy: v('navy'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
      },
      fontFamily: {
        display: ['var(--font-sora)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--accent)) 55%, rgb(var(--glow)) 100%)',
      },
      boxShadow: {
        depth:
          '0 1px 0 rgb(255 255 255 / 0.9) inset, 0 2px 4px rgb(11 31 75 / 0.04), 0 12px 24px -8px rgb(11 31 75 / 0.10), 0 32px 64px -24px rgb(29 78 216 / 0.22)',
        'depth-lg':
          '0 1px 0 rgb(255 255 255 / 0.9) inset, 0 4px 8px rgb(11 31 75 / 0.05), 0 24px 48px -12px rgb(11 31 75 / 0.14), 0 60px 100px -40px rgb(29 78 216 / 0.35)',
      },
      keyframes: {
        bob: { '0%,100%': { transform: 'translate3d(0,0,0)' }, '50%': { transform: 'translate3d(0,-10px,0)' } },
        rain: { from: { transform: 'translateY(-50%)' }, to: { transform: 'translateY(0%)' } },
        sweep: { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(100vh)' } },
      },
      animation: {
        bob: 'bob 7s ease-in-out infinite',
        rain: 'rain 14s linear infinite',
        sweep: 'sweep 4.5s cubic-bezier(.6,0,.4,1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
