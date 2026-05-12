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
        parchment: '#F5F0E8',
        'parchment-dark': '#E8E0D0',
        navy: '#1A1A2E',
        gold: '#C8973A',
        'gold-light': '#D4A94E',
        'scholarly-blue': '#4A6FA5',
        'warning-text': '#7A4A1A',
        'warning-bg': '#FDF3E3',
      },
      borderRadius: {
        xl: `calc(var(--radius) + 4px)`,
        lg: 'var(--radius)',
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
      fontFamily: {
        heading: ['"Frank Ruhl Libre"', 'serif'],
        body: ['Lora', 'serif'],
        mono: ['"Source Code Pro"', 'monospace'],
      },
      maxWidth: {
        chat: '780px',
      },
    },
  },
  plugins: [],
};
