import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        bounce: {
          "0%, 100%": { transform: "translate(0)" },
          "50%": { transform: "translate(0, 10px)" },
        },
      },
      animation: {
        walk: "wiggle 1s ease-out infinite",
        idle: "bounce 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["bumblebee"],
  },
} satisfies Config;
