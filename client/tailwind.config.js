/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "hsl(149, 58%, 50%)",
          dark: "hsl(149, 58%, 38%)",
          surface: "hsl(149, 20%, 97%)",
        },
        accent: "hsl(199, 70%, 52%)",
        warning: "hsl(38, 92%, 55%)",
        text: {
          base: "hsl(149, 10%, 18%)",
          muted: "hsl(149, 8%, 52%)",
        },
        border: "hsl(149, 15%, 88%)",
      },
    },
  },
  plugins: [],
};
