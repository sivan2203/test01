import { JetBrains_Mono, Onest } from "next/font/google";

export const onest = Onest({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-onest",
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});

export const jetBrainsMono = JetBrains_Mono({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  fallback: ["Consolas", "monospace"],
});
