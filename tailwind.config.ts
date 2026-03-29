import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — deep forest green
        brand: {
          50:  "#f0faf4",
          100: "#d8f3dc",
          200: "#b0e6bc",
          300: "#74cc8a",
          400: "#40916C",
          500: "#2D6A4F",
          600: "#1E4D38",
          700: "#163827",
          800: "#0e2419",
          900: "#07110c",
          // Semantic aliases used throughout UI
          green:          "#2D6A4F",  // = brand-500
          "green-light":  "#40916C",  // = brand-400
          "green-pale":   "#d8f3dc",  // = brand-100
          cream:          "#f0faf4",  // = brand-50
          amber:          "#f59e0b",  // warm saffron accent
        },
        // Saffron/amber accent — very Indian
        saffron: {
          50:  "#fffbf0",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fbbf24",
          400: "#f59e0b",
          500: "#d97706",
          600: "#b45309",
          700: "#92400e",
        },
        // Emergency red
        danger: {
          50:  "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          900: "#7f1d1d",
        },
        // Earth tones
        earth: {
          50:  "#faf8f5",
          100: "#f5f0e8",
          200: "#e8dfd0",
          300: "#d4c5aa",
          400: "#b8a07a",
          500: "#9c7d52",
          600: "#7a5f3a",
        },
        // Surface colors
        surface: {
          0:    "#ffffff",
          1:    "#fdfcfa",
          2:    "#f9f7f4",
          3:    "#f3f0eb",
          cream: "#f9f7f4", // semantic alias = surface-2
        },
      },

      fontFamily: {
        sans:    ["var(--font-poppins)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        hindi:   ["var(--font-noto)", "system-ui", "sans-serif"],
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      boxShadow: {
        "card":    "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-md": "0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)",
        "card-lg": "0 8px 32px -4px rgb(0 0 0 / 0.1), 0 4px 12px -2px rgb(0 0 0 / 0.05)",
        "glow-green":  "0 0 24px 0 rgb(45 106 79 / 0.25)",
        "glow-red":    "0 0 24px 0 rgb(220 38 38 / 0.35)",
        "glow-saffron":"0 0 24px 0 rgb(245 158 11 / 0.3)",
        "inner-brand": "inset 0 1px 0 0 rgb(255 255 255 / 0.1)",
      },

      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)",
        "gradient-brand-dark": "linear-gradient(135deg, #1E4D38 0%, #2D6A4F 100%)",
        "gradient-saffron": "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
        "gradient-earth": "linear-gradient(135deg, #f9f7f4 0%, #f0f9f4 100%)",
        "gradient-card": "linear-gradient(145deg, #ffffff 0%, #fdfcfa 100%)",
        "gradient-emergency": "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },

      animation: {
        "fade-in":       "fadeIn 0.4s ease-out both",
        "fade-up":       "fadeUp 0.5s ease-out both",
        "fade-down":     "fadeDown 0.4s ease-out both",
        "scale-in":      "scaleIn 0.3s ease-out both",
        "slide-up":      "slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) both",
        "slide-right":   "slideRight 0.4s cubic-bezier(0.32, 0.72, 0, 1) both",
        "pulse-ring":    "pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-gentle": "bounceGentle 2s ease-in-out infinite",
        "shimmer":       "shimmer 1.5s linear infinite",
        "spin-slow":     "spin 3s linear infinite",
        "wiggle":        "wiggle 0.5s ease-in-out",
        "float":         "float 3s ease-in-out infinite",
        "progress":      "progressFill 2s linear forwards",
        "ping-slow":     "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeDown: {
          "0%":   { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%":   { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideRight: {
          "0%":   { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%":      { transform: "scale(1.05)", opacity: "0.8" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%":      { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        progressFill: {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
      },

      transitionTimingFunction: {
        "spring":      "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "smooth":      "cubic-bezier(0.4, 0, 0.2, 1)",
        "out-expo":    "cubic-bezier(0.19, 1, 0.22, 1)",
        "in-back":     "cubic-bezier(0.6, -0.28, 0.74, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
