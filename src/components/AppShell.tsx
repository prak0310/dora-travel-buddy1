import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Globe, LogOut, Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { GlobalChat } from "./GlobalChat";

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
  const [menuOpen, setMenuOpen] = useState(false);

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
          {/* Desktop User Panel */}
          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-3">
            {username && (
              <div
                className="size-8 rounded-full bg-gradient-to-br from-[#c4956a] to-[#a0522d] flex items-center justify-center text-white text-xs font-medium"
                title={`Logged in as ${username}`}
              >
                {initial}
              </div>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-ink hover:bg-cream rounded-full transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-card border-l border-border shadow-2xl p-6 flex flex-col md:hidden transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="font-serif text-2xl text-ink"
          >
            Dora <span className="text-muted-foreground italic">AI</span>
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 text-ink hover:bg-cream rounded-full transition-colors focus:outline-none cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setMenuOpen(false)}
              className={`nav-link text-base py-2 block ${current === n.to ? "active" : ""}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border pt-6 mt-auto flex flex-col gap-4">
          <button className="btn-ghost w-full justify-center">
            <Globe className="size-4" /> EN
          </button>
          {username && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-gradient-to-br from-[#c4956a] to-[#a0522d] flex items-center justify-center text-white text-sm font-medium">
                  {initial}
                </div>
                <span className="text-sm font-medium text-ink">{username}</span>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="btn-ghost text-[#a0522d] border-[#a0522d]/20 hover:bg-[#a0522d]/5 w-full justify-center flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

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
      {username && <GlobalChat />}
    </div>
  );
}
