import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Sex Chat in Hindi, Hinglish & English — No Signup",
  description:
    "Start a free AI sex chat right now. Talk to an AI girlfriend or boyfriend in Hindi, Hinglish or English — flirty, explicit, and 100% private. No signup, no filter.",
  alternates: {
    canonical: "/sexchat",
  },
  openGraph: {
    title: "Free AI Sex Chat in Hindi, Hinglish & English — No Signup",
    description:
      "Talk to an AI girlfriend or boyfriend in Hindi, Hinglish or English — flirty, explicit, and 100% private.",
    url: "/sexchat",
  },
};

export default function SexChatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
