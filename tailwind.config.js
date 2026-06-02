/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
    "!./backend/**",
  ],
  theme: {
    extend: {
      colors: {
        wassel: {
          blue: '#002B49',
          yellow: '#FFCD00',
          darkBlue: '#001A2F',
          lightYellow: '#FFD733',
        },
        corp: {
          primary: '#3D3D3D',
          secondary: '#FFCD00',
          dark: '#262626',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
