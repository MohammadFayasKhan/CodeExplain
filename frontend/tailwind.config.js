/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Tailwind CSS utility extension config mapped to Stitch variables.
 */

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#191a1f',
          elevated: '#1f2028',
        },
        surface: {
          card: '#2a2b35',
          pill: '#3a3b47',
          hover: '#40414f',
        },
        ink: {
          primary: '#ffffff',
          secondary: '#c5c6d0',
          muted: '#8a8b96',
        },
        accent: {
          DEFAULT: '#7c6af7',
          soft: '#a89cff',
          glow: 'rgba(124,106,247,0.35)',
        },
        cta: '#ffffff',
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.12)',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '48px',
        '2xl': '64px',
        '3xl': '96px',
      },
      borderRadius: {
        pill: '9999px',
        card: '24px',
        button: '20px',
        badge: '4px',
      },
      fontFamily: {
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-hero': ['80px', { lineHeight: '1.1', fontWeight: '500', letterSpacing: '-0.03em' }],
        'subtitle': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['13px', { lineHeight: '17.55px', fontWeight: '400', letterSpacing: '0.02em' }],
        'placeholder': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'pill': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blob-float': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(30px,-40px) scale(1.08)' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'blob-float': 'blob-float 18s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
