import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        vendico: {
          purple: "hsl(var(--vendico-purple))",
          green: "hsl(var(--vendico-green))",
          orange: "hsl(var(--vendico-orange))",
          blue: "hsl(var(--vendico-blue))",
        },
        purple: {
          50: "hsl(263 30% 97%)",
          100: "hsl(263 30% 94%)",
          200: "hsl(263 35% 88%)",
          300: "hsl(263 50% 78%)",
          400: "hsl(263 65% 68%)",
          500: "hsl(263 70% 50%)",
          600: "hsl(263 65% 45%)",
          700: "hsl(263 60% 40%)",
          800: "hsl(263 55% 35%)",
          900: "hsl(263 50% 28%)",
        },
        pink: {
          50: "hsl(340 50% 97%)",
          100: "hsl(340 50% 92%)",
          200: "hsl(340 60% 85%)",
          300: "hsl(340 70% 75%)",
          400: "hsl(340 75% 68%)",
          500: "hsl(340 80% 60%)",
          600: "hsl(340 75% 52%)",
          700: "hsl(340 70% 45%)",
          800: "hsl(340 65% 38%)",
          900: "hsl(340 60% 30%)",
        },
        teal: {
          50: "hsl(158 40% 97%)",
          100: "hsl(158 45% 92%)",
          200: "hsl(158 50% 82%)",
          300: "hsl(158 55% 70%)",
          400: "hsl(158 58% 58%)",
          500: "hsl(158 64% 45%)",
          600: "hsl(158 58% 38%)",
          700: "hsl(158 55% 32%)",
          800: "hsl(158 50% 26%)",
          900: "hsl(158 45% 20%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'purple': '0 4px 20px -4px hsl(270 70% 60% / 0.35)',
        'purple-lg': '0 10px 30px -5px hsl(270 70% 60% / 0.3)',
        'glow': '0 0 25px hsl(270 70% 60% / 0.2)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(270 70% 60% / 0.2)" },
          "50%": { boxShadow: "0 0 25px hsl(270 70% 60% / 0.4)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 1.5s infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
