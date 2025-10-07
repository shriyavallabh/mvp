/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Linear Design System Colors - Exact match from HTML
        linear: {
          bg: '#0A0A0A',           // Main background
          purple: '#7C3AED',        // Primary purple
          'purple-light': '#A78BFA', // Light purple
          'purple-lighter': '#C4B5FD', // Lighter purple
          'purple-dark': '#6D28D9', // Dark purple for gradients
          zinc: {
            100: '#FAFAFA',
            200: '#E4E4E7',
            300: '#D4D4D8',
            400: '#A1A1AA',
            500: '#71717A',
            600: '#52525B',
            700: '#3F3F46',
            800: '#27272A',
            900: '#18181B',
          },
          whatsapp: '#25D366',      // WhatsApp green
        },
      },
      backgroundImage: {
        // Gradient definitions from HTML
        'gradient-purple': 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
        'gradient-purple-dark': 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
        'gradient-text': 'linear-gradient(135deg, #FFFFFF 0%, #A78BFA 50%, #7C3AED 100%)',
      },
      fontFamily: {
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease',
        'slide-in': 'slideIn 0.4s ease',
        'pulse-slow': 'pulse 2s infinite',
      },
    },
  },
  plugins: [],
}
