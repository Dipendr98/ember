"use client";

import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Flame, Library, Settings, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const content_en = {
  badge: "🔥 Private romantic role-play for couples",
  title: "Make the night last.",
  subtitle:
    "Pick a scenario, shape a character, and let an AI storyteller weave a slow-burn role-play you both steer together. Long-context, fully private, as steamy as you want it.",
  easyModeTitle: "Start now",
  easyModeBody: "Bypass the setup. Just enter your names, pick a scenario, and let the AI take over with the best settings.",
  easyModeCta: "Easy Mode",
  cards: [
    {
      href: "/scenarios",
      icon: Library,
      title: "Start a new story",
      body: "Browse built-in scenarios or write your own. Each one is a doorway into a different night.",
      cta: "Pick a scenario",
    },
    {
      href: "/setup",
      icon: Settings,
      title: "Set up your couple profile",
      body: "Names, pronouns, what you love. Everything stays on this device.",
      cta: "Open settings",
    },
    {
      href: "/sessions",
      icon: BookOpen,
      title: "Continue a saved session",
      body: "Pick up exactly where you left off — Ember remembers the whole story.",
      cta: "Saved sessions",
    },
    {
      href: "/scenarios?custom=1",
      icon: Sparkles,
      title: "Improvise",
      body: "Skip the library and start a blank scene. Describe what you want and dive in.",
      cta: "Free play",
    },
  ],
};

const content_hi = {
  badge: "🔥 कपल्स के लिए प्राइवेट रोमांटिक रोल-प्ले",
  title: "रात को यादगार बनाएं।",
  subtitle:
    "एक परिदृश्य चुनें, एक चरित्र को आकार दें, और एक एआई कहानीकार को एक धीमी गति वाला रोल-प्ले बुनने दें जिसे आप दोनों एक साथ निर्देशित करते हैं। लंबी कहानी, पूरी तरह से निजी, और जितना आप चाहें उतना उत्तेजक।",
  easyModeTitle: "अभी शुरू करें",
  easyModeBody: "सेटअप को छोड़ें। बस अपने नाम दर्ज करें, एक परिदृश्य चुनें, और एआई को सर्वोत्तम सेटिंग्स के साथ काम करने दें।",
  easyModeCta: "आसान मोड",
  cards: [
    {
      href: "/scenarios",
      icon: Library,
      title: "एक नई कहानी शुरू करें",
      body: "अंतर्निहित परिदृश्य ब्राउज़ करें या अपना स्वयं का लिखें। हर एक एक अलग रात का दरवाजा है।",
      cta: "एक परिदृश्य चुनें",
    },
    {
      href: "/setup",
      icon: Settings,
      title: "अपनी कपल प्रोफाइल सेट करें",
      body: "नाम, सर्वनाम, आपको क्या पसंद है। सब कुछ इसी डिवाइस पर रहता है।",
      cta: "सेटिंग्स खोलें",
    },
    {
      href: "/sessions",
      icon: BookOpen,
      title: "सेव किया गया सेशन जारी रखें",
      body: "बिल्कुल वहीं से शुरू करें जहां आपने छोड़ा था — एम्बर को पूरी कहानी याद है।",
      cta: "सेव किए गए सेशन",
    },
    {
      href: "/scenarios?custom=1",
      icon: Sparkles,
      title: "इम्प्रोवाइज करें",
      body: "लाइब्रेरी छोड़ें और एक खाली दृश्य शुरू करें। वर्णन करें कि आप क्या चाहते हैं और शुरू हो जाएं।",
      cta: "फ्री प्ले",
    },
  ],
};

export default function Home() {
  const { language } = useLanguage();
  const t = language === "hi" ? content_hi : content_en;

  return (
    <Shell>
      {/* Hero Section with Custom Background Image */}
      <section className="relative w-full rounded-[2rem] overflow-hidden mb-12 animate-fade-in group shadow-2xl shadow-accent/20 border border-accent/30 neon-border-strong">
        <div className="absolute inset-0 bg-[url('/hero-intimate-bg.png')] bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/90" />
        <div className="absolute inset-0 bg-accent/5 mix-blend-overlay" />

        {/* Dripping effect dots */}
        <div className="absolute top-0 left-1/4 w-1 h-16 bg-gradient-to-b from-accent to-transparent rounded-full opacity-30 animate-drip" />
        <div className="absolute top-0 right-1/3 w-1.5 h-20 bg-gradient-to-b from-accent-soft to-transparent rounded-full opacity-25 animate-drip-delayed" />

        <div className="relative z-10 px-6 py-20 sm:py-32 text-center flex flex-col items-center justify-center min-h-[70vh]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/50 backdrop-blur-sm neon-border text-accent-soft text-sm font-semibold mb-6 animate-slide-up">
            <Flame className="w-4 h-4 animate-heartbeat" />
            {t.badge}
          </div>

          <h1 className="text-5xl sm:text-8xl font-bold tracking-tight mb-6 gradient-text leading-tight max-w-4xl animate-slide-up">
            {t.title}
          </h1>

          <p className="text-foreground/85 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-md mb-10 font-medium animate-slide-up">
            {t.subtitle}
          </p>

          <Link
            href="/easy"
            className="sexy-btn inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl text-lg animate-slide-up"
          >
            <Flame className="w-5 h-5" />
            {t.easyModeCta}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-12 animate-fade-in">
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text">10+</div>
          <div className="text-xs text-muted mt-1">Scenarios</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text">Private</div>
          <div className="text-xs text-muted mt-1">Only your browser</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text">हिंदी</div>
          <div className="text-xs text-muted mt-1">Hindi + English</div>
        </div>
      </section>

      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {t.cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="sexy-card rounded-2xl p-6 relative overflow-hidden group"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-accent/10 text-accent-soft group-hover:scale-110 transition-transform neon-border">
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-accent-soft transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed mb-4 min-h-[3rem]">
                  {card.body}
                </p>
                <div className="inline-flex items-center gap-1.5 text-sm font-medium gradient-text-pink opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  {card.cta} <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promises section */}
      <section className="sexy-card rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold mb-6 gradient-text-pink animate-text-glow text-center">
          🔥 A few promises 🔥
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-3xl mb-2 animate-heartbeat">💋</div>
            <h3 className="font-semibold text-accent-soft mb-2">High heat.</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Ember writes vivid adult romance that keeps the scene moving and finishes cleanly.
            </p>
          </div>
          <div className="text-center p-4 border-x border-accent/10">
            <div className="text-3xl mb-2 animate-moan">🔒</div>
            <h3 className="font-semibold text-accent-soft mb-2">Privacy by default.</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              No accounts, no servers remembering you. Your profile and sessions live only in this browser.
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-accent-soft mb-2">You steer.</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Ember writes scene-beats and waits for you. Type one line or a paragraph — it follows your lead.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
