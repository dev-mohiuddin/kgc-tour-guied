/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        background: '#FAFAFA',
        surface: '#FFFFFF',
        text: '#171717',
        card: '#FFFFFF',
        'card-foreground': '#171717',
        popover: '#FFFFFF',
        'popover-foreground': '#171717',
        muted: '#f5f5f5',
        'muted-foreground': '#737373',
        accent: '#f5f5f5',
        'accent-foreground': '#171717',
        destructive: '#dc2626',
        'destructive-foreground': '#ffffff',
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#059669',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        bangla: ['var(--font-bangla)', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
