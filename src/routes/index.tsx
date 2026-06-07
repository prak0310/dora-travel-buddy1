import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ScanLine, Route as RouteIcon, ShieldCheck, Search, ArrowRight, Sparkles } from "lucide-react";
import gion from "@/assets/gion.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dora AI — Your intelligent travel companion" },
      { name: "description", content: "One AI companion for translation, transit, food and culture. Travel light. Wander braver." },
      { property: "og:title", content: "Dora AI — Travel companion" },
      { property: "og:description", content: "Translate menus, simplify transit, fact-check recommendations. All in one calm place." },
    ],
  }),
  component: Home,
});

const features = [
  { to: "/translate", icon: ScanLine, title: "Menu Analysis", desc: "Instantly translate and explain local ingredients with photography.", cta: "Open tool" },
  { to: "/transit", icon: RouteIcon, title: "Transit Guide", desc: "Real-time navigation and local transport insights for seamless urban journeys.", cta: "View routes" },
  { to: "/fact-check", icon: ShieldCheck, title: "Fact-Check Explore", desc: "Verify trending recommendations and cultural facts as you wander through cities.", cta: "Start wandering" },
];

function Home() {
  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
        <span className="pill"><Sparkles className="size-3" /> Travel light. Wander braver.</span>
        <h1 className="font-serif text-6xl md:text-7xl text-ink mt-6 leading-[1.05]">
          Where to next, <em className="italic">Lakshmi?</em>
        </h1>
        <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
          One quiet companion for the messy parts of travel — menus, trains, customs, and the gut feeling that you might be missing something.
        </p>
        <div className="glass-card max-w-2xl mx-auto mt-10 p-2 flex items-center">
          <Search className="size-5 text-muted-foreground mx-4" />
          <input
            placeholder="Ask Dora anything — a dish, a station, a custom…"
            className="flex-1 bg-transparent outline-none py-3 text-sm"
          />
          <button className="btn-primary">Search</button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-8 grid md:grid-cols-3 gap-5">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="glass-card p-7 group hover:translate-y-[-2px] transition-transform">
            <div className="size-10 rounded-lg bg-cream border border-border flex items-center justify-center">
              <f.icon className="size-5 text-ink" />
            </div>
            <h3 className="font-serif text-2xl text-ink mt-5">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            <div className="mt-6 text-sm text-ink flex items-center gap-1 group-hover:gap-2 transition-all">
              {f.cta} <ArrowRight className="size-4" />
            </div>
          </Link>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-12 mb-20">
        <div className="glass-card overflow-hidden grid md:grid-cols-[1.3fr_1fr]">
          <div className="p-10">
            <span className="pill" style={{ background: "color-mix(in oklch, var(--terracotta) 14%, white)", color: "var(--terracotta)", borderColor: "color-mix(in oklch, var(--terracotta) 25%, transparent)" }}>● Live recommendation</span>
            <h2 className="font-serif text-4xl text-ink mt-5 leading-tight">Sipping Peace in the Gion District</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Based on your interest in quiet mornings and traditional architecture, Dora suggests the Kyoto Gion district — just a 6-minute walk from your current location. Pair an espresso with the warm light of a Hozugawa morning to start the day rooted in the small details.
            </p>
            <div className="mt-7 flex gap-3">
              <button className="btn-primary">Open route</button>
              <button className="btn-ghost">Save for later</button>
            </div>
          </div>
          <div className="relative">
            <img src={gion} alt="Traditional Japanese ryokan interior with warm light" className="w-full h-full object-cover" loading="lazy" width={1024} height={1024} />
            <div className="absolute bottom-4 left-4 right-4 glass-card p-3 text-xs">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Current destination</div>
              <div className="text-ink font-medium mt-0.5">Kyoto, Japan</div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
