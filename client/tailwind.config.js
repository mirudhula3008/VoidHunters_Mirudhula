/** @type {import('tailwindcss').Config} */

// FixIT theme: deep navy on pale blue, from the team's reference design.
// Every colour is a CSS variable set in src/index.css (:root for light, [data-theme='dark'] for dark),
// so existing utility classes switch with the mode automatically.
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const scale = (name, shades) => Object.fromEntries(shades.map((shade) => [shade, c(`${name}-${shade}`)]));
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800];

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: c('navy'),
        blue: scale('blue', [...SHADES, 900]),
        slate: scale('slate', [...SHADES, 900]),
        emerald: scale('emerald', SHADES),
        amber: scale('amber', SHADES),
        rose: scale('rose', [50, 100, 200, 400, 500, 600, 700, 800]),
        red: scale('red', [50, 500, 600, 700]),
        sky: scale('sky', [50, 200, 700]),
        orange: scale('orange', [100, 800]),
        indigo: scale('indigo', [50, 200, 700]),
      },
      // Backgrounds differ from text in dark mode: bg-white is a dark surface while text-white
      // stays white, bg-navy is a bright button while text-navy turns pale, and the darker
      // shades must stay dark enough for white text on hover.
      backgroundColor: {
        white: c('surface'),
        navy: c('navy-bg'),
        blue: { 700: c('bg-blue-700') },
        emerald: { 700: c('bg-emerald-700') },
        rose: { 700: c('bg-rose-700') },
      },
      borderColor: {
        white: c('surface-border'),
      },
      fontFamily: {
        // Indic fallbacks render Tamil, Hindi and Bengali text in the matching Noto Sans.
        sans: ['Montserrat', '"Noto Sans Tamil"', '"Noto Sans Devanagari"', '"Noto Sans Bengali"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', '"Noto Sans Tamil"', '"Noto Sans Devanagari"', '"Noto Sans Bengali"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 4px rgba(10, 34, 89, 0.04), 0 8px 24px rgba(10, 34, 89, 0.07)',
        lift: '0 10px 30px rgba(10, 34, 89, 0.14)',
        glow: '0 0 0 4px rgba(18, 63, 156, 0.15)',
      },
    },
  },
  plugins: [],
};
