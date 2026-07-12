import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ember — Intimate Role-Play for Couples",
  description:
    "A private, AI-powered role-play companion for couples. Build scenarios, characters, and slow-burn stories together.",
  other: {
    // AdSense site-verification meta tag — Google's "meta tag" verify method.
    "google-adsense-account": "ca-pub-8604216728521266",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0d1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Plain <script> (not next/script) so the literal tag appears in the
            served HTML — the AdSense verification crawler looks for the exact
            snippet. React hoists async scripts into <head>. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8604216728521266"
          crossOrigin="anonymous"
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
