import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BadgeCheck, Star, Flame } from "lucide-react";
import cafe from "@/assets/cafe.jpg";
import shibuya from "@/assets/shibuya.jpg";
import akihabara from "@/assets/akihabara.jpg";
import zen from "@/assets/zen.jpg";
import tea from "@/assets/tea.jpg";

export const Route = createFileRoute("/fact-check")({
  head: () => ({
    meta: [
      { title: "Fact-Check Explore — Dora AI" },
      { name: "description", content: "Trending travel content, cross-verified with real reviews. Skip the overhyped tourist traps." },
    ],
  }),
  component: FactCheck,
});

const items = [
  { img: cafe, badge: { label: "Worth the hype", color: "sage" }, title: "Cafe Reissue", desc: "The understated origin of 10 lattes a min in Harajuku. Our locals visited to verify if the wait is worth it.", tags: [{ icon: BadgeCheck, label: "Artistry verified" }, { icon: Star, label: "Wait time avg. ~22 min, weekends an hr+." }], h: "h-[280px]" },
  { img: shibuya, badge: { label: "Overrated", color: "terra" }, title: "Shibuya Sky", desc: "Sunset times often sold out 5 days ahead. Stunning if available, but pick a weekday.", tags: [{ icon: BadgeCheck, label: "Best hour: when the rain clears" }], h: "h-[220px]" },
  { img: akihabara, badge: null, title: "Akihabara After Dark", desc: "The best time for street photography is 8:30 PM, after the main neons turn on.", h: "h-[200px]" },
  { img: zen, badge: null, title: "Kyoto Zen Gardens", desc: "Hidden gems away from the Arashiyama crowds. Verified for peace and serenity.", h: "h-[220px]" },
  { img: tea, badge: null, title: "Tea Ceremony Insight", desc: "Skip the tourist traps. We've found this matcha master provides true experiences in Gion.", h: "h-[260px]" },
];

function FactCheck() {
  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-2xl">
          <span className="pill"><Flame className="size-3" /> Trending right now</span>
          <h1 className="font-serif text-6xl text-ink mt-4 leading-[1.05]">The Fact-Check Feed</h1>
          <p className="mt-4 text-muted-foreground">
            Effortless intelligence for your next journey. We verify the trends so you can travel with absolute serenity.
          </p>
        </div>

        <div className="mt-12 columns-1 md:columns-3 gap-5 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {items.map((it, i) => (
            <article key={i} className="glass-card overflow-hidden">
              <div className="relative">
                <img src={it.img} alt={it.title} className={`w-full ${it.h} object-cover`} loading="lazy" width={1024} height={1024} />
                {it.badge && (
                  <span
                    className="absolute top-3 left-3 pill"
                    style={{
                      background: it.badge.color === "sage" ? "color-mix(in oklch, var(--sage) 18%, white)" : "color-mix(in oklch, var(--terracotta) 18%, white)",
                      color: it.badge.color === "sage" ? "var(--sage)" : "var(--terracotta)",
                      borderColor: "transparent",
                    }}
                  >
                    ● {it.badge.label}
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl text-ink">{it.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{it.desc}</p>
                {it.tags && (
                  <div className="mt-4 space-y-1.5">
                    {it.tags.map((t, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <t.icon className="size-3.5 text-[var(--sage)]" /> {t.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
