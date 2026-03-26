/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0C2D62',
          50: '#E8EDF5',
          100: '#D1DBEB',
          200: '#A3B7D7',
          300: '#7593C3',
          400: '#476FAF',
          500: '#0C2D62',
          600: '#0A2450',
          700: '#081B3E',
          800: '#06122C',
          900: '#04091A'
        },
        accent: {
          DEFAULT: '#028090',
          50: '#E6F5F7',
          100: '#CCEBEF',
          200: '#99D7DF',
          300: '#66C3CF',
          400: '#33AFBF',
          500: '#028090',
          600: '#026673',
          700: '#014D56',
          800: '#013339',
          900: '#001A1D'
        },
        danger: {
          DEFAULT: '#E24B4A',
          50: '#FCE9E9',
          100: '#F9D3D3',
          200: '#F3A7A6',
          300: '#ED7B7A',
          400: '#E74F4D',
          500: '#E24B4A',
          600: '#B53C3B',
          700: '#882D2C',
          800: '#5B1E1E',
          900: '#2E0F0F'
        },
        warning: {
          DEFAULT: '#BA7517',
          50: '#F5EDE3',
          100: '#EBDBC7',
          200: '#D7B78F',
          300: '#C39357',
          400: '#AF6F1F',
          500: '#BA7517',
          600: '#955E12',
          700: '#70460E',
          800: '#4B2F09',
          900: '#261705'
        },
        success: {
          DEFAULT: '#1D9E75',
          50: '#E7F5F0',
          100: '#CFEBE1',
          200: '#9FD7C3',
          300: '#6FC3A5',
          400: '#3FAF87',
          500: '#1D9E75',
          600: '#177E5E',
          700: '#115F46',
          800: '#0C3F2F',
          900: '#062017'
        },
        background: '#F7F9FC',
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}
