import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ScanLine, Route as RouteIcon, ShieldCheck, Search, ArrowRight, Sparkles, Loader2, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/UserContext";
import gion from "@/assets/gion.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dora AI — Your intelligent travel companion" },
      { name: "description", content: "Translate menus, simplify transit, fact-check recommendations. All in one calm place." },
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

const N8N_PERSONALISED_URL = "http://localhost:5678/webhook/dora-personalised";

type Rec = {
  title?: string;
  verdict?: string;
  confidence?: number;
  rating?: number;
  summary?: string;
  url?: string;
  category?: string;
  destination?: string;
  photoUrl?: string;
};

function RecCard({ recs, destination }: { recs: Rec[]; destination: string }) {
  const [idx, setIdx] = useState(0);
  const item = recs[idx];
  const label = item.verdict ?? "Live recommendation";
  const title = (item.title ?? "").replace(/^[^\w\s]*\s*/, "");

  return (
    <div>
      <div className="glass-card overflow-hidden grid md:grid-cols-[1.3fr_1fr]">
        <div className="p-10">
          <span className="pill" style={{ background: "color-mix(in oklch, var(--terracotta) 14%, white)", color: "var(--terracotta)", borderColor: "color-mix(in oklch, var(--terracotta) 25%, transparent)" }}>
            ● {label}
          </span>
          <h2 className="font-serif text-4xl text-ink mt-5 leading-tight">{title || "Recommendation"}</h2>
          {item.summary && (
            <p className="mt-4 text-muted-foreground leading-relaxed">{item.summary}</p>
          )}
          {item.rating != null && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
              <Star className="size-4" /> {item.rating} rating
              {item.confidence != null && ` · ${Math.round(item.confidence * 100)}% confidence`}
            </div>
          )}
          <div className="mt-7">
            {item.url
              ? <a href={item.url} target="_blank" rel="noreferrer" className="btn-primary">View on Maps</a>
              : <button className="btn-primary">Open route</button>
            }
          </div>
        </div>
        <div className="relative">
          <img
            src={item.photoUrl || gion}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            width={1024}
            height={1024}
            onError={(e) => { (e.target as HTMLImageElement).src = gion; }}
          />
          <div className="absolute bottom-4 left-4 right-4 glass-card p-3 text-xs">
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Current destination</div>
            <div className="text-ink font-medium mt-0.5">{item.destination ?? destination}</div>
          </div>
        </div>
      </div>

      {recs.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-5">
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="btn-ghost p-2 disabled:opacity-30">
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex gap-2">
            {recs.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`size-2 rounded-full transition-colors ${i === idx ? "bg-ink" : "bg-border"}`} />
            ))}
          </div>
          <button onClick={() => setIdx(i => Math.min(recs.length - 1, i + 1))} disabled={idx === recs.length - 1} className="btn-ghost p-2 disabled:opacity-30">
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Home() {
  const { username } = useUser();

  const [recs, setRecs] = useState<Rec[]>([]);
  const [destination, setDestination] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function fetchRecs(userId: string) {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(N8N_PERSONALISED_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const recommendations: Rec[] = data.recommendations ?? [];
      setRecs(recommendations);
      // n8n decides the destination from the user's own search history —
      // read it back from whichever rec came back rather than guessing it ourselves
      setDestination(recommendations[0]?.destination ?? null);
    } catch {
      setRecs([]);
      setDestination(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const userId = username ?? "user_001";
    fetchRecs(userId);
  }, [username]);

  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
        <span className="pill"><Sparkles className="size-3" /> Travel light. Wander braver.</span>
        <h1 className="font-serif text-6xl md:text-7xl text-ink mt-6 leading-[1.05]">
          Where to next, <em className="italic">{username || "Traveller"}?</em>
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

      {/* Personalised recommendations */}
      <section className="max-w-6xl mx-auto px-6 mt-12 mb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-3xl text-ink">
              For You{destination ? ` · ${destination}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Personalised picks based on your travel history</p>
          </div>
          {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        </div>

        {/* Loading skeleton */}
        {loading && recs.length === 0 && (
          <div className="glass-card overflow-hidden grid md:grid-cols-[1.3fr_1fr] animate-pulse">
            <div className="p-10 space-y-4">
              <div className="h-5 bg-border rounded w-1/4" />
              <div className="h-8 bg-border rounded w-3/4 mt-5" />
              <div className="h-4 bg-border rounded w-full" />
              <div className="h-4 bg-border rounded w-5/6" />
            </div>
            <div className="bg-border" />
          </div>
        )}

        {/* No results — fall back to Gion card */}
        {!loading && searched && recs.length === 0 && (
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
        )}

        {/* Real personalised recs in Gion-card style with prev/next */}
        {recs.length > 0 && (
          <RecCard recs={recs} destination={destination ?? "your destination"} />
        )}
      </section>
    </AppShell>
  );
}
