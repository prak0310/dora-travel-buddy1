import { Link, useRouterState } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Explore" },
  { to: "/translate", label: "Translate" },
  { to: "/fact-check", label: "Fact-Check" },
  { to: "/transit", label: "Transit" },
  { to: "/food", label: "Food" },
  { to: "/cultural", label: "Cultural Guide" },
];

export function AppShell({ children, active }: { children: ReactNode; active?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = active ?? pathname;
  return (
    <div className="surface min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[color-mix(in_oklch,var(--background)_70%,transparent)] border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl text-ink">Dora <span className="text-muted-foreground italic">AI</span></Link>
          <nav className="hidden md:flex items-center gap-8">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className={`nav-link ${current === n.to ? "active" : ""}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="btn-ghost"><Globe className="size-4" /> EN</button>
            <div className="size-9 rounded-full bg-gradient-to-br from-[oklch(0.7_0.08_50)] to-[oklch(0.55_0.1_30)] flex items-center justify-center text-white text-sm font-medium">L</div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-serif text-lg text-ink">Dora AI</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Terms</a>
            <a href="#" className="hover:text-ink">Help Center</a>
            <a href="#" className="hover:text-ink">Contact</a>
          </div>
          <div className="text-xs">© 2026 Dora · Journey with intent.</div>
        </div>
      </footer>
    </div>
  );
}
