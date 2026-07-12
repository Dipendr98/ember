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

const SITE_URL = "https://ember.buzz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ember — Free AI Sex Chat in Hindi | AI Girlfriend & Couples Roleplay",
    template: "%s | Ember",
  },
  description:
    "Free AI sex chat in Hindi, Hinglish & English. Chat with an AI girlfriend or boyfriend, or play private erotic roleplay stories as a couple. No signup, 100% private — everything stays in your browser.",
  keywords: [
    "AI sex chat",
    "hindi sex chat",
    "AI girlfriend hindi",
    "AI girlfriend india",
    "free AI sex chat",
    "adult AI chat",
    "NSFW AI chat",
    "hindi adult chat",
    "AI boyfriend",
    "couples roleplay",
    "erotic roleplay AI",
    "desi AI chat",
    "sex chat AI free",
    "AI romantic chat hindi",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Ember",
    title: "Ember — Free AI Sex Chat in Hindi | AI Girlfriend & Couples Roleplay",
    description:
      "Chat with an AI girlfriend or boyfriend in Hindi, Hinglish & English. Private erotic roleplay for couples. Free, no signup, fully private.",
    locale: "en_IN",
    images: [
      {
        url: "/hero-intimate-bg.png",
        width: 1024,
        height: 1024,
        alt: "Ember — AI sex chat and couples roleplay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ember — Free AI Sex Chat in Hindi | AI Girlfriend & Couples Roleplay",
    description:
      "Chat with an AI girlfriend or boyfriend in Hindi, Hinglish & English. Free, no signup, fully private.",
    images: ["/hero-intimate-bg.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    // AdSense site-verification meta tag — Google's "meta tag" verify method.
    "google-adsense-account": "ca-pub-4281817564741172",
    // Adult-content labels so search engines and parental filters classify
    // the site correctly (also a policy requirement for adult ad networks).
    rating: "adult",
    RATING: "RTA-5042-1996-1400-1577-RTA",
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
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4281817564741172"
          crossOrigin="anonymous"
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
