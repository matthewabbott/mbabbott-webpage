/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-background': '#1a1f2c', // Deep dark blue/grey
        'brand-surface': '#2c3243',   // Slightly lighter surface color
        'brand-card': '#3a4154',      // Card background color
        'brand-primary': '#e53e3e',    // Red accent color (from image)
        'brand-text': '#e2e8f0',       // Light text color
        'brand-text-muted': '#a0aec0', // Muted text color
      },
    },
  },
  plugins: [],
};
