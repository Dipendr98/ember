import type { Metadata } from "next";

// Per-user chat sessions live only in the visitor's browser — nothing useful
// for search engines to index here.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SexChatSessionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
