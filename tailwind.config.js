<<<<<<< HEAD
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: { 950: "#040414" },
        nebula: { 700: "#312e81" },
        plasma: { 500: "#a855f7" },
        ion: { 400: "#22d3ee" },
        starlight: { 300: "#f0abfc" },
        comet: { 400: "#f59e0b" },
      },
      boxShadow: {
        glow: "0 0 24px rgba(168,85,247,.35)",
      },
      keyframes: {
        twinkle: { to: { transform: "translateY(-50px)" } },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        twinkle: "twinkle 10s linear infinite",
        float: "float 3s ease-in-out infinite",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
=======
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: { 950: "#040414" },
        nebula: { 700: "#312e81" },
        plasma: { 500: "#a855f7" },
        ion: { 400: "#22d3ee" },
        starlight: { 300: "#f0abfc" },
        comet: { 400: "#f59e0b" },
      },
      boxShadow: {
        glow: "0 0 24px rgba(168,85,247,.35)",
      },
      keyframes: {
        twinkle: { to: { transform: "translateY(-50px)" } },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        twinkle: "twinkle 10s linear infinite",
        float: "float 3s ease-in-out infinite",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
>>>>>>> 82ed382 (Initial publish)
