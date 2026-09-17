import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Instrument_Serif } from "next/font/google";
import { asset } from "@/lib/base-path";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zeta Rho Orders",
    template: "%s · Zeta Rho Orders",
  },
  description: "Drink orders for Lambda Chi Alpha, Zeta Rho chapter.",
  // Hidden page: never let search engines list it.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        {/* Runtime backend URL, editable without a rebuild (see public/config.js). */}
        <Script src={asset("/config.js")} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
