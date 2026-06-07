import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Camera, AlertCircle, CheckCircle2, Leaf } from "lucide-react";
import menuHero from "@/assets/menu-hero.jpg";

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "Menu Analysis — Dora AI" },
      { name: "description", content: "Point your camera at a menu. Dora translates, explains ingredients, and flags dietary concerns." },
    ],
  }),
  component: Translate,
});

function Translate() {
  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-[1.1fr_1fr] gap-10">
        <div className="glass-card overflow-hidden relative">
          <img src={menuHero} alt="Japanese calligraphy on washi paper" className="w-full h-[560px] object-cover" loading="lazy" width={1024} height={1024} />
          <div className="absolute top-4 left-4 pill"><span className="size-2 rounded-full bg-[var(--terracotta)] animate-pulse" /> Translation active</div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
            <h2 className="font-serif text-3xl">Kyoto Seasonal Selection</h2>
            <p className="text-sm opacity-80 mt-1">Tap any character to hear its pronunciation.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="pill">Translation</span>
            <h1 className="font-serif text-5xl text-ink mt-3">Translations</h1>
            <p className="text-muted-foreground mt-3">AI-powered transcription and cultural context for your dining journey.</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-xl text-ink">Tonkotsu Ramen</div>
                <div className="text-xs text-muted-foreground mt-0.5">とんこつラーメン</div>
              </div>
              <div className="text-sm text-ink font-medium">¥1,200</div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              A rich, creamy pork bone broth simmered for 12 hours, served with thin straight noodles, chashu pork, and spring onion.
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="pill" style={{ background: "color-mix(in oklch, var(--terracotta) 12%, white)", color: "var(--terracotta)" }}>● Contains pork</span>
              <span className="pill">● Contains egg</span>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Leaf className="size-3.5" /> Cultural etiquette
            </div>
            <p className="font-serif italic text-xl text-ink mt-2">"Slurping is encouraged."</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              In Japan, slurping your noodles is a sign of appreciation and helps cool the hot broth while enhancing the aroma. Don't be shy.
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-xl text-ink">Miso Black Cod</div>
                <div className="text-xs text-muted-foreground mt-0.5">西京焼き黒鱈</div>
              </div>
              <div className="text-sm text-ink font-medium">¥2,400</div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Butter-soft black cod marinated in sweet saikyo miso and grilled to caramelized perfection.
            </p>
          </div>

          <div className="glass-card p-5 bg-[oklch(0.96_0.02_85)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink font-medium">
              <CheckCircle2 className="size-4 text-[var(--sage)]" /> Dietary safety check
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Gluten-free options</span><AlertCircle className="size-4 text-[var(--terracotta)]" /></div>
              <div className="flex items-center justify-between"><span>Vegetarian friendly</span><CheckCircle2 className="size-4 text-[var(--sage)]" /></div>
              <div className="flex items-center justify-between"><span>Nut-free facility</span><CheckCircle2 className="size-4 text-[var(--sage)]" /></div>
            </div>
          </div>

          <button className="btn-primary w-full mt-2"><Camera className="size-4" /> Scan another menu</button>
        </div>
      </section>
    </AppShell>
  );
}
