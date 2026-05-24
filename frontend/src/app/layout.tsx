import type { Metadata } from "next";
import "./globals.css";
import { AmbientBackground } from "@/components/layout/ambient-bg";

export const metadata: Metadata = {
  title: "AI Powered Smart Electric Meter — Energy Intelligence",
  description:
    "AI Powered Smart Electric Meter — detect electricity theft, voltage anomalies and overload risk in real-time. AI-driven grid intelligence for the next generation of cities.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2300F0FF'/%3E%3Cstop offset='0.5' stop-color='%238B5CF6'/%3E%3Cstop offset='1' stop-color='%23FF3DCC'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M18 3 L8 18 H15 L13 29 L24 13 H17 L19 3 Z' fill='url(%23g)'/%3E%3C/svg%3E"
        />
      </head>
      <body className="font-sans">
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
