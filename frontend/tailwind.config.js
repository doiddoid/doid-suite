/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // doID Brand Teal - Primary color palette
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#139898',  // doID brand teal
          600: '#0f7a7a',  // darker teal for hover states
          700: '#0d6363',
          800: '#0a4d4d',
          900: '#083838',
          950: '#052525',
        },
        // doID Brand tokens
        doid: {
          primary: '#139898',      // Brand teal
          secondary: '#212121',    // Dark charcoal
          accent: '#f59e0b',       // Amber accent
          success: '#10b981',      // Green
          warning: '#f59e0b',      // Amber
          error: '#ef4444',        // Red
          light: '#f8fafc',        // Light background
          dark: '#0f172a',         // Dark text
        },
        // Neutral grays
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Roboto', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'doid': '0 4px 14px 0 rgba(19, 152, 152, 0.25)',
        'doid-lg': '0 10px 40px -10px rgba(19, 152, 152, 0.35)',
      },
      borderRadius: {
        'doid': '10px',
      },
    },
  },
  plugins: [],
}
