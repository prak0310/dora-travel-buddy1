import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

import {
  ScanLine,
  Route as RouteIcon,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Bot,
  Send,
  Loader2,
  ExternalLink,
  Camera,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

import { useUser } from "@/lib/UserContext";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import remarkGfm from "remark-gfm";

import gion from "@/assets/gion.jpg";
import doraImg from "@/assets/dora.png";

const ReactMarkdown = lazy(() => import("react-markdown"));

const markdownComponents = {
  a: ({ href, children, ...props }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <ExternalLink className="inline-block size-3 ml-0.5 align-baseline opacity-60" />
    </a>
  ),
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dora AI — Your intelligent travel companion" },
      {
        name: "description",
        content:
          "Translate menus, simplify transit, fact-check recommendations.",
      },
      { property: "og:title", content: "Dora AI — Travel companion" },
      {
        property: "og:description",
        content:
          "Translate menus, simplify transit, fact-check recommendations.",
      },
    ],
  }),
  component: Home,
});

const features = [
  {
    to: "/food",
    icon: ScanLine,
    title: "Food Explorer",
    desc: "Upload a photo of a menu or restaurant front...",
    cta: "Open tool",
  },
  {
    to: "/transit",
    icon: RouteIcon,
    title: "Transit Explorer",
    desc: "Get step-by-step transit guidance.",
    cta: "View routes",
  },
  {
    to: "/fact-check",
    icon: ShieldCheck,
    title: "Fact-Check Explorer",
    desc: "Verify places and recommendations.",
    cta: "Start wandering",
  },
  {
    to: "/cultural",
    icon: Camera,
    title: "Cultural Explorer",
    desc: "Scan surroundings for cultural insights.",
    cta: "Open camera",
  },
];

const N8N_PERSONALISED_URL = "http://localhost:5678/webhook/dora-personalised";

type Rec = {
  title?: string;
  verdict?: string;
  confidence?: number;
  rating?: number;
  summary?: string;
  url?: string;
  destination?: string;
  photoUrl?: string;
};

function RecCard({
  recs,
  destination,
}: {
  recs: Rec[];
  destination: string;
}) {
  const [idx, setIdx] = useState(0);
  const item = recs[idx];

  return (
    <div>
      <div className="glass-card overflow-hidden grid md:grid-cols-[1.3fr_1fr]">
        <div className="p-10">
          <span className="pill">● {item.verdict ?? "Recommendation"}</span>

          <h2 className="font-serif text-4xl mt-5">
            {item.title ?? "Recommendation"}
          </h2>

          {item.summary && (
            <p className="mt-4 text-muted-foreground">{item.summary}</p>
          )}

          {item.rating != null && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Star className="size-4" />
              {item.rating} rating
            </div>
          )}

          <div className="mt-7">
            {item.url ? (
              <a href={item.url} target="_blank" className="btn-primary">
                View on Maps
              </a>
            ) : (
              <button className="btn-primary">Open route</button>
            )}
          </div>
        </div>

        <img
          src={item.photoUrl || gion}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  actionType?: string;
}

function cleanReply(raw: string) {
  return raw
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/<\/?reasoning>/gi, "")
    .trim();
}

function Home() {
  const { username } = useUser();

  const [recs, setRecs] = useState<Rec[]>([]);
  const [destination, setDestination] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      const userId = username ?? "user_001";
      setLoading(true);
      setSearched(true);

      try {
        const res = await fetch(N8N_PERSONALISED_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        setRecs(data.recommendations ?? []);
        setDestination(data.recommendations?.[0]?.destination ?? null);
      } catch {
        setRecs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [username]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, chatLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMsg = { role: "user", content: text };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);

    try {
      const history = [...messages, userMsg]
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          location: "Singapore",
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanReply(data.reply),
          actionType: data.action_type,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error: " + err.message,
        },
      ]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-20 text-center">
        <h1 className="font-serif text-6xl">
          Where to next, {username || "Traveller"}?
        </h1>

        {/* CHAT BOX */}
        <div className="relative glass-card mt-10">
          {chatOpen && (
            <div className="absolute top-2 right-2 z-20">
              <img
                src={doraImg}
                className="w-20 h-20 object-contain drop-shadow-xl"
              />
            </div>
          )}

          {chatOpen && (
            <div
              ref={scrollRef}
              className="max-h-[400px] overflow-y-auto p-5 space-y-4"
            >
              {messages.map((m, i) => (
                <div key={i} className="text-sm">
                  <b>{m.role}:</b> {m.content}
                </div>
              ))}

              {chatLoading && (
                <div className="text-sm opacity-60">Thinking...</div>
              )}
            </div>
          )}

          <div className="flex p-2 border-t">
            <input
              ref={inputRef}
              value={input}
              onFocus={() => setChatOpen(true)}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2"
              placeholder="Ask Dora..."
            />

            <button
              onClick={handleSend}
              disabled={chatLoading}
              className="btn-primary"
            >
              {chatLoading ? <Loader2 /> : <Send />}
            </button>
          </div>
        </div>

        {/* REC SECTION */}
        {recs.length > 0 && (
          <RecCard recs={recs} destination={destination ?? "Unknown"} />
        )}
      </section>
    </AppShell>
  );
}

