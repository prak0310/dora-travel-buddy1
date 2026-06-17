import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Globe, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useUser } from "@/lib/UserContext";

const nav = [
  { to: "/", label: "Explore" },
  { to: "/fact-check", label: "Fact-Check" },
  { to: "/transit", label: "Transit" },
  { to: "/food", label: "Food" },
  { to: "/cultural", label: "Cultural Guide" },
  { to: "/settings", label: "Settings" },
];

export function AppShell({ children, active }: { children: ReactNode; active?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = active ?? pathname;
  const { username, logout } = useUser();
  const navigate = useNavigate();

  const initial = username ? username.charAt(0).toUpperCase() : "?";

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

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
            {username && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">{username}</span>
                <div
                  className="size-9 rounded-full bg-gradient-to-br from-[#c4956a] to-[#a0522d] flex items-center justify-center text-white text-sm font-medium"
                  title={`Logged in as ${username}`}
                >
                  {initial}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-ghost text-[#a0522d] border-[#a0522d]/20 hover:bg-[#a0522d]/5 dark:text-[#c4956a] dark:border-[#c4956a]/20 dark:hover:bg-[#c4956a]/5 transition-colors duration-200 cursor-pointer flex items-center gap-2"
                  title="Log out"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
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
