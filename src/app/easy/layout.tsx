import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instant AI Roleplay — Start an Erotic Story in 10 Seconds",
  description:
    "Skip the setup. Enter your names, pick a vibe, and the AI starts a private erotic roleplay story instantly — in Hindi or English, free and without signup.",
  alternates: {
    canonical: "/easy",
  },
  openGraph: {
    title: "Instant AI Roleplay — Start an Erotic Story in 10 Seconds",
    description:
      "Enter your names, pick a vibe, and the AI starts a private erotic roleplay story instantly.",
    url: "/easy",
  },
};

export default function EasyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
