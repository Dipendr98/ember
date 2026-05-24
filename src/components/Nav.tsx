"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Library, Settings, BookOpen, Globe, MessageCircleHeart } from "lucide-react";
import { useLanguage } from "./LanguageContext";

const links_en = [
  { href: "/", label: "Home", icon: Flame },
  { href: "/scenarios", label: "Scenarios", icon: Library },
  { href: "/sessions", label: "Saved", icon: BookOpen },
  { href: "/setup", label: "Couple", icon: Settings },
  { href: "/sexchat", label: "AI Chat", icon: MessageCircleHeart },
];

const links_hi = [
  { href: "/", label: "होम", icon: Flame },
  { href: "/scenarios", label: "परिदृश्य", icon: Library },
  { href: "/sessions", label: "सेव किए गए", icon: BookOpen },
  { href: "/setup", label: "कपल", icon: Settings },
  { href: "/sexchat", label: "AI चैट", icon: MessageCircleHeart },
];

export function Nav() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const links = language === "hi" ? links_hi : links_en; // hinglish uses English labels

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-accent/20 shadow-[0_0_30px_rgba(233,30,99,0.12)]">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <Flame className="w-5 h-5 text-accent group-hover:text-accent-soft animate-heartbeat" />
            <span className="font-semibold tracking-wide gradient-text-pink text-lg">
              Ember
            </span>
          </Link>
          <button
            onClick={() => setLanguage(language === "en" ? "hi" : language === "hi" ? "hinglish" : "en")}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-card hover:bg-accent/20 border border-card-border hover:border-accent/50 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === "en" ? "हिंदी" : language === "hi" ? "Hinglish" : "English"}
          </button>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.slice(1).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm transition-all ${active
                  ? "bg-accent/20 text-accent-soft shadow-[0_0_10px_rgba(233,30,99,0.2)]"
                  : "text-muted hover:text-accent-soft hover:bg-card/80"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
