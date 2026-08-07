import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F2F1EC',
        surface: '#FFFFFF',
        ink: '#15181B',
        muted: '#6B6F72',
        line: '#E2E0D8',
        pine: {
          50: '#EAF0EC',
          100: '#CBDBD1',
          400: '#3E6E5A',
          600: '#2D5D4F',
          700: '#20463B',
        },
        citrine: {
          400: '#D8B368',
          500: '#C9A15A',
          600: '#A87F3E',
        },
        rust: {
          500: '#B5502F',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
export default config;
