/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        parchment: '#FAFAF8',
        'parchment-dark': '#E8E4DC',
        ink: '#2C2A26',
        navy: '#2C2A26',
        gold: '#B8860B',
        'gold-light': '#C9972E',
        'gold-muted': '#F5EDD8',
        'scholarly-blue': '#5B7FA6',
        'warning-text': '#7A4A1A',
        'warning-bg': '#FDF6E8',
      },
      borderRadius: {
        xl: `calc(var(--radius) + 4px)`,
        lg: 'var(--radius)',
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
        sketch: '255px 15px 225px 15px / 15px 225px 15px 255px',
        'sketch-sm': '12px 4px 10px 3px / 4px 10px 3px 12px',
      },
      fontFamily: {
        heading: ['"Frank Ruhl Libre"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        sketch: ['Caveat', 'cursive'],
        mono: ['"Source Code Pro"', 'monospace'],
      },
      maxWidth: {
        chat: '720px',
      },
      boxShadow: {
        sketch: '2px 3px 0 0 rgba(44, 42, 38, 0.06)',
        'sketch-md': '3px 4px 0 0 rgba(44, 42, 38, 0.08)',
        soft: '0 1px 3px rgba(44, 42, 38, 0.04), 0 4px 12px rgba(44, 42, 38, 0.03)',
      },
    },
  },
  plugins: [],
};
