/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // NASA color palette
        'nasa-blue': '#0B3D91',
        'nasa-red': '#FC3D21',
        'nasa-dark': '#212121',
        'nasa-light': '#f8f9fa',
        
        // Colorblind-friendly palette
        'cb-blue': '#0066cc',
        'cb-orange': '#ff6600',
        'cb-green': '#00cc66',
        'cb-purple': '#9933cc',
        'cb-yellow': '#ffcc00',
        
        // Modern UI colors
        'primary': 'var(--primary-color, #1e3a8a)',
        'secondary': 'var(--secondary-color, #3b82f6)',
        'accent': 'var(--accent-color, #f97316)',
        'background-dark': 'var(--background-dark, #0f172a)',
        'text-light': 'var(--text-light, #f1f5f9)',
        
        // Space-themed gradients
        'space-gradient-from': '#0B3D91',
        'space-gradient-to': '#FC3D21',
        'cosmic-purple': '#6D28D9',
        'nebula-blue': '#1E40AF',
        'star-yellow': '#FBBF24',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'nasa': ['Orbitron', 'Roboto', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'meteor': 'meteor 5s linear infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px theme(colors.nasa-blue), 0 0 10px theme(colors.nasa-blue), 0 0 15px theme(colors.nasa-blue)' },
          '100%': { boxShadow: '0 0 10px theme(colors.nasa-red), 0 0 20px theme(colors.nasa-red), 0 0 30px theme(colors.nasa-red)' },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': { transform: 'rotate(215deg) translateX(-500px)', opacity: '0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(50px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(50px) rotate(-360deg)' },
        },
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'cosmic-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
        'nebula': 'linear-gradient(45deg, #0B3D91, #6D28D9, #FC3D21)',
        'starfield': 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
      },
      boxShadow: {
        'cosmic': '0 0 20px theme(colors.nasa-blue / 0.3), 0 0 40px theme(colors.nasa-red / 0.2)',
        'orbit': '0 0 60px theme(colors.nasa-blue / 0.4)',
        'meteor': '0 0 30px theme(colors.nasa-red / 0.6), 0 0 60px theme(colors.nasa-red / 0.4)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  // Enable important to ensure Tailwind overrides other styles
  important: true,
}