/** @type {import('tailwindcss').Config} */

// FixIT theme: deep navy on pale blue, from the team's reference design.
// The standard blue / slate / emerald / amber scales are remapped to the theme
// so existing utility classes pick up the palette automatically.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0A2259',
        // Service Blue — primary accent, links, CTAs
        blue: {
          50: '#EAF1FC', // --blue-muted
          100: '#D9E6FA',
          200: '#B9CFF3',
          300: '#8EB0E8',
          400: '#5A86D6', // --blue-light
          500: '#2F62BE',
          600: '#123F9C', // --blue
          700: '#0E3380',
          800: '#0B2A6B',
          900: '#0A2259',
        },
        // Neutrals — section background, borders, muted and main text
        slate: {
          50: '#F1F5FC', // --bg-section
          100: '#E8EEF8',
          200: '#DCE5F3', // --border
          300: '#C6D2E6',
          400: '#8496B8',
          500: '#52627F', // --fg-muted
          600: '#445471',
          700: '#2F4064',
          800: '#1C2E56',
          900: '#0A2259', // --fg / --navy
        },
        // Green — verified, available, success
        emerald: {
          50: '#E3F5EE', // --green-light
          100: '#C9EBDD',
          200: '#A6DDC6',
          300: '#6FC7A2',
          400: '#45B788',
          500: '#2AA876', // --green
          600: '#2AA876',
          700: '#1F8A5F',
          800: '#176B4A',
        },
        // Amber — CTA accent, stars, negotiable
        amber: {
          50: '#FFF6E8',
          100: '#FFEACC', // --amber-light
          200: '#FFDCA8',
          300: '#FBC56A',
          400: '#F5A623', // --amber
          500: '#F5A623',
          600: '#D98C0E',
          700: '#A86A06',
          800: '#8A5A0B',
        },
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
