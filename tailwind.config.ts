import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        // Trading Zone Colors
                        support: {
                                DEFAULT: '#22C55E',
                                light: 'rgba(34, 197, 94, 0.2)',
                                medium: 'rgba(34, 197, 94, 0.35)',
                                strong: 'rgba(34, 197, 94, 0.5)',
                        },
                        resistance: {
                                DEFAULT: '#EF4444',
                                light: 'rgba(239, 68, 68, 0.2)',
                                medium: 'rgba(239, 68, 68, 0.35)',
                                strong: 'rgba(239, 68, 68, 0.5)',
                        },
                        entry: {
                                DEFAULT: '#3B82F6',
                                light: 'rgba(59, 130, 246, 0.2)',
                                medium: 'rgba(59, 130, 246, 0.35)',
                                strong: 'rgba(59, 130, 246, 0.5)',
                        },
                        takeprofit: {
                                DEFAULT: '#FACC15',
                                light: 'rgba(250, 204, 21, 0.2)',
                                medium: 'rgba(250, 204, 21, 0.35)',
                                strong: 'rgba(250, 204, 21, 0.5)',
                        },
                        stoploss: {
                                DEFAULT: '#374151',
                                light: 'rgba(55, 65, 81, 0.3)',
                                medium: 'rgba(55, 65, 81, 0.45)',
                                strong: 'rgba(55, 65, 81, 0.6)',
                        },
                        // App background colors
                        dark: {
                                primary: '#0F172A',
                                secondary: '#111827',
                                tertiary: '#1E293B',
                        }
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                }
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
