/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tesla-inspired color palette - 2025 Edition
        tesla: {
          black: '#000000',
          darkGray: '#0d0d0d',
          mediumGray: '#1a1a1a',
          lightGray: '#2d2d2d',
          white: '#ffffff',
          red: '#ff3b30',
          blue: '#0a84ff',
          green: '#30d158',
          purple: '#bf5af2',
          accent: '#0071e3'
        },
        // Premium Dark theme colors
        dark: {
          bg: '#000000',
          surface: '#0d0d0d',
          card: '#1a1a1a',
          'card-hover': '#222222',
          border: '#2d2d2d',
          'border-subtle': '#1a1a1a',
          text: '#ffffff',
          'text-secondary': '#e5e5e5',
          muted: '#8e8e93',
          'muted-light': '#aeaeb2'
        },
        // Modern accent colors for data visualization
        accent: {
          danger: '#ff3b30',
          'danger-soft': '#ff453a',
          warning: '#ff9f0a',
          'warning-soft': '#ffa00a',
          success: '#30d158',
          'success-soft': '#32d158',
          info: '#0a84ff',
          'info-soft': '#0a84ff',
          purple: '#bf5af2',
          'purple-soft': '#bf5af2',
          cyan: '#64d2ff',
          pink: '#ff375f'
        }
      },
      fontFamily: {
        'tesla': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace']
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'gradient': 'gradient 8s linear infinite',
        'blur-in': 'blurIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(48, 209, 88, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(48, 209, 88, 0.5), 0 0 40px rgba(48, 209, 88, 0.3)' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(10, 132, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(10, 132, 255, 0.6), 0 0 60px rgba(10, 132, 255, 0.3)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        blurIn: {
          '0%': { filter: 'blur(10px)', opacity: '0' },
          '100%': { filter: 'blur(0)', opacity: '1' }
        }
      },
      backdropBlur: {
        'xs': '2px',
        'safari': '20px'
      },
      backdropSaturate: {
        '180': '1.8'
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-lg': '0 24px 64px rgba(0, 0, 0, 0.2)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'tesla': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'tesla-lg': '0 20px 60px rgba(0, 0, 0, 0.4)',
        'glow-green': '0 0 40px rgba(48, 209, 88, 0.4)',
        'glow-blue': '0 0 40px rgba(10, 132, 255, 0.4)',
        'glow-red': '0 0 40px rgba(255, 59, 48, 0.4)',
        'glow-purple': '0 0 40px rgba(191, 90, 242, 0.4)',
        'inner-glow': 'inset 0 1px 2px rgba(255, 255, 255, 0.05)',
        'neumorphic': '8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.02)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'gradient-tesla': 'linear-gradient(180deg, #000000 0%, #0d0d0d 100%)',
        'gradient-blur': 'linear-gradient(180deg, rgba(10, 132, 255, 0.1) 0%, transparent 100%)',
        'mesh-pattern': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.01\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        'noise': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"3.5\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.03\"/%3E%3C/svg%3E')",
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
      },
      blur: {
        'xs': '2px',
        '4xl': '80px',
        '5xl': '100px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
