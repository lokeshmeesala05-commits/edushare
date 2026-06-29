/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '960px', // Custom 960px to trigger desktop layouts on 980px mobile viewports
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      colors: {
        brand: {
          primary: '#2563EB', // Primary Blue
          navy: '#1E3A8A',    // Navy Blue
          emerald: '#10B981', // Emerald Green
          amber: '#F59E0B',   // Amber
          bg: '#F8FAFC',      // Light Background
          text: '#1F2937',    // Text Dark
          border: '#E5E7EB',  // Borders
        },
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // teal-500
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      }
    },
  },
  plugins: [],
}

