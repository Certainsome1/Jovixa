import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15191f",
        panel: "#f7f8fa",
        line: "#d9dee7",
        cobalt: "#1f5eff",
        mint: "#0f9f77",
        amber: "#b76e00",
        rose: "#c73d5b"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 25, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
