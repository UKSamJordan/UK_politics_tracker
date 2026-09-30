/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        party: {
          labour: '#E4003B',
          conservative: '#0087DC',
          reform: '#12B6CF',
          libdem: '#FAA61A',
          green: '#528D22',
          snp: '#D99B00',
          plaid: '#005B54',
          restore: '#5B2C6F',
        }
      }
    },
  },
  plugins: [],
}
