import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ScanLine, Route as RouteIcon, ShieldCheck, Search, ArrowRight, Sparkles, Bot, Send, Loader2, ExternalLink, Camera, ChevronLeft, ChevronRight, Star, Mic } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import remarkGfm from "remark-gfm";
import gion from "@/assets/gion.jpg";
import { ScrollVideo } from "@/components/ScrollVideo";
import mascot from "../../mascot.png";


const ReactMarkdown = lazy(() => import("react-markdown"));

/** Custom components for ReactMarkdown rendering */
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
      { name: "description", content: "Translate menus, simplify transit, fact-check recommendations. All in one calm place." },
      { property: "og:title", content: "Dora AI — Travel companion" },
      { property: "og:description", content: "Translate menus, simplify transit, fact-check recommendations. All in one calm place." },
    ],
  }),
  component: Home,
});

const features = [
  { to: "/fact-check", icon: ShieldCheck, title: "Fact-Check Explorer", desc: "Ask about any attraction, restaurant, or place to stay and get up-to-date, verified information pulled from the latest travel trends. Great for finding hidden gems or checking if somewhere is actually worth the hype.", cta: "Start wandering" },
  { to: "/transit", icon: RouteIcon, title: "Transit Explorer", desc: "Tell Dora where you're headed and get a step-by-step transit guide with a map view, broken down in plain language.", cta: "View routes" },
  { to: "/food", icon: ScanLine, title: "Food Explorer", desc: "Upload a photo of a menu or restaurant front to get personalised dish recommendations based on your budget and dietary needs. Or share your location to discover what's good nearby.", cta: "Open tool" },
  { to: "/cultural", icon: Camera, title: "Cultural Explorer", desc: "Point your camera at anything around you — a landmark, sign, banner, or poster — and get the cultural backstory, local etiquette, useful phrases, and how to say them out loud.", cta: "Open camera" },
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


interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  actionType?: string;
}

/** Strip LLM reasoning/thinking artifacts */
function cleanReply(raw: string): string {
  let text = raw;
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  const idx = text.lastIndexOf("</reasoning>");
  if (idx !== -1) text = text.substring(idx + "</reasoning>".length);
  text = text.replace(/<\/?reasoning>/gi, "");
  text = text
    .split("\n")
    .filter((line) => {
      const pct = line.match(/%[0-9A-Fa-f]{2}/g);
      return !(pct && pct.length > 10 && (pct.length * 3) / line.length > 0.4);
    })
    .join("\n");
  return text.trim();
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

  const [messages, setMessages] = useSessionStorage<ChatMsg[]>("dora-chat-messages", []);
  const [chatOpen, setChatOpen] = useSessionStorage("dora-chat-open", false);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  const featuresRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!featuresRef.current) return;
      const rect = featuresRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Start calculating when the section's top enters the viewport
      // Complete calculation after a scroll trigger distance of 500px
      const scrollTriggerDistance = 500;
      const scrolledDistance = viewportHeight - rect.top;

      let progress = scrolledDistance / scrollTriggerDistance;
      progress = Math.max(0, Math.min(1, progress));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial run

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          
          setChatOpen(true);
          setChatLoading(true);

          try {
            const formData = new FormData();
            formData.append('audio_file', audioBlob, 'recording.webm');
            formData.append('location', destination || 'Unknown');

            const res = await fetch("http://localhost:8000/api/v1/voice-chat", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

            const data = await res.json();
            
            // Append user transcript
            const userMsg: ChatMsg = { role: "user", content: data.user_transcript || "🎤 (Voice Message)" };
            setMessages(prev => [...prev, userMsg]);
            
            // Append assistant response
            const assistantMsg: ChatMsg = {
              role: "assistant",
              content: cleanReply(data.dora_text_response),
              actionType: "VOICE",
            };
            setMessages(prev => [...prev, assistantMsg]);

            // Play audio if available
            if (data.dora_audio_base64 && audioPlayerRef.current) {
              const audioSrc = `data:audio/wav;base64,${data.dora_audio_base64}`;
              audioPlayerRef.current.src = audioSrc;
              audioPlayerRef.current.play();
            }
          } catch (err: any) {
            setMessages(prev => [
              ...prev,
              { role: "assistant", content: `⚠️ Voice chat failed: ${err.message}`, actionType: "ERROR" }
            ]);
          } finally {
            setChatLoading(false);
            inputRef.current?.focus();
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access is required for voice chat.");
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);

    try {
      // Build history from last 6 messages for context
      const history = [...messages, userMsg]
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          location: "Unknown",
        }),
      });

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

      const data: { action_type: string; reply: string } = await res.json();
      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: cleanReply(data.reply),
        actionType: data.action_type,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Something went wrong: ${err.message}`, actionType: "ERROR" },
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

  const actionBadge = (type?: string) => {
    if (!type || type === "ERROR") return null;
    const map: Record<string, { label: string; color: string }> = {
      RESEARCH: { label: "Deep Research", color: "#6366f1" },
      ROUTING: { label: "Feature Tip", color: "#f59e0b" },
      GENERAL: { label: "Chat", color: "#10b981" },
    };
    const badge = map[type] || { label: type, color: "#6b7280" };
    return (
      <span
        className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
        style={{ background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}30` }}
      >
        {badge.label}
      </span>
    );
  };


  return (
    <AppShell>
      <ScrollVideo />

      <div className="relative bg-cream z-10 pt-10">
        <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
          <img 
            src="/dora.jpeg" 
            alt="Dora" 
            className="absolute -right-8 lg:-right-24 top-48 lg:top-56 w-40 md:w-48 lg:w-64 hidden md:block pointer-events-none z-20"
            style={{ transform: 'rotate(5deg)' }}
          />

          <span className="pill relative z-10"><Sparkles className="size-3" /> Travel light. Wander braver.</span>
          <h1 className="relative z-10 font-serif text-6xl md:text-7xl text-ink mt-6 leading-[1.05]">
            Where to next, <em className="italic">{username || "Traveller"}?</em>
          </h1>
          <p className="relative z-10 mt-5 text-muted-foreground max-w-xl mx-auto">
            One quiet companion for the messy parts of travel — menus, trains, customs, and the gut feeling that you might be missing something.
          </p>

          {/* Chat Interface */}
        <div
        className={`relative glass-card max-w-2xl mx-auto mt-10 overflow-hidden transition-all duration-300 ${
        chatOpen
        ? "border border-ink/40 shadow-xl shadow-ink/20"
        : "border border-border/50"
        }`}
        > 
        {chatOpen && (
  <div className="absolute top-2 right-2 animate-in fade-in zoom-in duration-300">
    <div className="w-10 h-10 rounded-full overflow-hidden border border-border shadow-lg bg-white flex items-center justify-center">
      <img
        src={gion}
        alt="Dora"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
)}

        {/* Messages Area */}
{chatOpen && (
  <div
    ref={scrollRef}
    className="max-h-[400px] overflow-y-auto p-5 space-y-4 text-left border-b border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-300"
    style={{ scrollBehavior: "smooth" }}
  >
    {messages.length === 0 && (
      <div className="text-center py-12">
        <Bot className="size-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-serif text-xl text-ink">
          Dora AI
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Ask me about food, customs, transit, local slang, or anything travel-related.
        </p>
      </div>
    )}

    {messages.map((msg, i) => (
      <div
        key={i}
        className={`flex gap-3 ${
          msg.role === "user" ? "justify-end" : "justify-start"
        }`}
        style={{ animation: "fadeSlideIn 0.3s ease-out" }}
      >
        {msg.role === "assistant" && (
          <div className="size-7 rounded-full bg-cream border border-border flex-shrink-0 flex items-center justify-center mt-1">
            <Bot className="size-3.5 text-ink" />
          </div>
        )}

        <div
          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            msg.role === "user"
              ? "bg-ink text-white rounded-br-md"
              : "bg-cream/60 text-ink rounded-bl-md border border-border/50"
          }`}
        >
          {msg.role === "assistant" && actionBadge(msg.actionType)}

          {msg.role === "assistant" ? (
            <div className="food-prose">
              <Suspense
                fallback={<Loader2 className="size-3 animate-spin" />}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {msg.content}
                </ReactMarkdown>
              </Suspense>
            </div>
          ) : (
            <p>{msg.content}</p>
          )}
        </div>

        {msg.role === "user" && (
          <div className="size-7 rounded-full bg-ink text-white flex-shrink-0 flex items-center justify-center mt-1 text-xs font-medium">
            {(username || "U")[0].toUpperCase()}
          </div>
        )}
      </div>
    ))}

    {chatLoading && (
      <div
        className="flex gap-3 justify-start"
        style={{ animation: "fadeSlideIn 0.3s ease-out" }}
      >
        <div className="size-7 rounded-full bg-cream border border-border flex-shrink-0 flex items-center justify-center mt-1">
          <Bot className="size-3.5 text-ink" />
        </div>

        <div className="bg-cream/60 text-ink rounded-2xl rounded-bl-md border border-border/50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full bg-ink/40 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="size-1.5 rounded-full bg-ink/40 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="size-1.5 rounded-full bg-ink/40 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    )}
  </div>
)}



          {/* Input Bar */}
          <div className={`flex items-center p-2 ${messages.length > 0 ? "border-t border-border/40" : ""}`}>
            <input
              ref={inputRef}
              value={input}
              onFocus={() => setChatOpen(true)}
              onChange={(e) => {
                setInput(e.target.value);

                if (e.target.value.length > 0) {
                setChatOpen(true);
                }
            }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Dora anything — a dish, a station, a custom…"
              className="flex-1 bg-transparent outline-none py-3 px-4 text-sm"
              disabled={chatLoading}
            />
            <button
              onClick={handleToggleRecording}
              className={`p-2 mr-2 rounded-full transition-all flex items-center justify-center ${isRecording ? "bg-red-100 text-red-500 animate-pulse" : "bg-cream text-ink hover:bg-border/50"}`}
              title={isRecording ? "Stop Recording" : "Start Voice Chat"}
            >
              <Mic className="size-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={chatLoading || !input.trim()}
              className="btn-primary disabled:opacity-40 flex items-center gap-2"
            >
              {chatLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send
            </button>
            <audio ref={audioPlayerRef} className="hidden" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-16 mb-4">
        <h2 className="font-serif text-3xl md:text-4xl text-ink italic text-center">
          How to use Dora:
        </h2>
      </section>

      <section ref={featuresRef} className="max-w-6xl mx-auto px-6 mt-8 relative">
        {/* Walking Dora Mascot */}
        <div
          className="absolute -top-16 pointer-events-none z-20 w-16 h-16 md:w-20 md:h-20 transition-all duration-75 ease-out"
          style={{
            left: `calc(${scrollProgress * 100}% - 40px)`,
            transform: `translate(-50%, ${Math.sin(scrollProgress * 30) * 8}px) rotate(${Math.sin(scrollProgress * 20) * 12}deg)`,
            opacity: scrollProgress > 0.05 && scrollProgress < 0.95 ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <img src="/boots.png" alt="Walking Boots" className="w-full h-full object-contain" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, index) => {
            // Calculate visibility threshold for each card
            const threshold = 0.12 + index * 0.20;
            const isVisible = scrollProgress > threshold;

            return (
              <Link
                key={f.to}
                to={f.to}
                className={`glass-card p-7 group hover:translate-y-[-4px] transition-all duration-500 ease-out transform ${
                  isVisible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-8 scale-95 pointer-events-none"
                }`}
              >
                <div className="size-10 rounded-lg bg-cream border border-border flex items-center justify-center">
                  <f.icon className="size-5 text-ink" />
                </div>
                <h3 className="font-serif text-2xl text-ink mt-5">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
                <div className="mt-6 text-sm text-ink flex items-center gap-1 group-hover:gap-2 transition-all">
                  {f.cta} <ArrowRight className="size-4" />
                </div>
              </Link>
            );
          })}
        </div>
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
      </div>
    </AppShell>
  );
}

