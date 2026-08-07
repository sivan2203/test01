import type { Metadata } from "next";
import { jetBrainsMono, onest } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Персональная витрина",
    template: "%s · Персональная витрина",
  },
  description: "Простая публичная витрина и рабочий кабинет малого продавца.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${onest.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a className="skip-link" href="#main-content">
          К основному содержанию
        </a>
        {children}
      </body>
    </html>
  );
}
