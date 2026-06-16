import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@/lib/UserContext";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Welcome — Dora AI" },
      { name: "description", content: "Enter your name to personalise your Dora AI experience." },
    ],
  }),
  component: Login,
});

function Login() {
  const { setUsername } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setUsername(trimmed);
    navigate({ to: "/" });
  };

  return (
    <div className="surface min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-10">
          <h1 className="font-serif text-5xl text-ink">Dora <span className="text-muted-foreground italic">AI</span></h1>
          <p className="text-muted-foreground text-sm mt-2">Your intelligent travel companion</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="glass-card p-8">
          <div className="size-14 rounded-full bg-gradient-to-br from-[#c4956a] to-[#a0522d] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="size-6 text-white" />
          </div>

          <h2 className="font-serif text-2xl text-ink mb-2">Welcome, traveller</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Enter your name so Dora can personalise your journey.
          </p>

          <div className={`transition-transform ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
            <input
              id="login-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn-primary w-full mt-5"
          >
            Continue
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Your name is stored locally and never sent to a server.
        </p>
      </div>
    </div>
  );
}
