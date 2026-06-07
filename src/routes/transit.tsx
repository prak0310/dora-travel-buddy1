import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Train, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/transit")({
  head: () => ({
    meta: [
      { title: "Transit Guide — Dora AI" },
      { name: "description", content: "Complex transit, gently translated. Numbered, plain-language steps from A to B." },
    ],
  }),
  component: Transit,
});

const steps = [
  { n: 1, title: "Enter Shibuya Station", body: "Head to the JR Southern Terrace Gate. Look for the green JR signs." },
  { n: 2, title: "Find Platform 14", body: "Follow the signs for the Yamanote Line (Outer Loop) heading towards Shinjuku." },
  { n: 3, title: "Board the train", body: "Ride for 3 stops. The train will announce Shinjuku in English and Japanese." },
  { n: 4, title: "Exit at Shinjuku", body: "Follow signs for the Hachiko Exit to reach the famous scramble crossing." },
];

function Transit() {
  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-2xl">
          <span className="pill"><Train className="size-3" /> Live transit</span>
          <h1 className="font-serif text-6xl text-ink mt-4 leading-[1.05]">Your Simple Path</h1>
          <p className="mt-4 text-muted-foreground">
            Navigation made effortless. Follow the numbered steps for a stress-free journey from Shinjuku to Shibuya.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-[1fr_1.2fr] gap-6">
          <div className="glass-card p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border-r border-border pr-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Clock className="size-3" /> Travel time</div>
                <div className="font-serif text-3xl text-ink mt-1">14 <span className="text-base text-muted-foreground">min</span></div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3" /> Scheduled stops</div>
                <div className="font-serif text-3xl text-ink mt-1">3 <span className="text-base text-muted-foreground">stops</span></div>
              </div>
            </div>

            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li key={s.n} className="relative pl-12 pb-6 last:pb-0">
                  <div className="absolute left-0 top-0 size-8 rounded-full bg-cream border border-border flex items-center justify-center font-serif text-ink">
                    {s.n}
                  </div>
                  {i < steps.length - 1 && <div className="absolute left-[15px] top-9 bottom-0 w-px bg-border" />}
                  <div className="font-medium text-ink">{s.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.body}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-card p-6">
            <div className="aspect-[4/5] rounded-lg bg-[oklch(0.96_0.015_80)] border border-border relative overflow-hidden">
              <svg viewBox="0 0 400 500" className="w-full h-full">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.9 0.01 80)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="500" fill="url(#grid)" />
                <path d="M 60 80 Q 150 120 200 200 T 340 420" stroke="oklch(0.65 0.13 145)" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M 80 60 L 300 80 L 350 200 L 280 380" stroke="oklch(0.65 0.13 45)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
                <path d="M 40 250 L 200 280 L 360 240" stroke="oklch(0.6 0.13 240)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
                {[
                  [60, 80, "Shibuya"],
                  [200, 200, "Harajuku"],
                  [260, 300, "Yoyogi"],
                  [340, 420, "Shinjuku"],
                ].map(([x, y, l], i) => (
                  <g key={i}>
                    <circle cx={x as number} cy={y as number} r="6" fill="white" stroke="oklch(0.22 0.02 60)" strokeWidth="2" />
                    <text x={(x as number) + 12} y={(y as number) + 4} fontSize="11" fill="oklch(0.22 0.02 60)" fontFamily="serif">{l}</text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Current journey</div>
                <div className="font-medium text-ink mt-0.5">Shinjuku → Shibuya</div>
              </div>
              <button className="btn-ghost">Live</button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
