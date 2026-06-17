import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Bot, Send, Loader2, Mic, X, Sparkles } from "lucide-react";
import remarkGfm from "remark-gfm";
import { useUser } from "@/lib/UserContext";
import mascot from "../../mascot.png";

const ReactMarkdown = lazy(() => import("react-markdown"));

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

const markdownComponents = {
  a: ({ href, children, ...props }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props} className="text-[#6b316f] underline hover:text-[#5a295e]">
      {children}
    </a>
  ),
};

export function GlobalChat() {
  const { username } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading, isOpen]);

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

          setChatLoading(true);

          try {
            const formData = new FormData();
            formData.append('audio_file', audioBlob, 'recording.webm');
            formData.append('location', 'Unknown');

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
        className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full mb-1"
        style={{ background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}30` }}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[380px] h-[500px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4 animate-[fadeSlideIn_0.3s_ease] transition-all">
          {/* Header */}
          <div className="bg-[#6b316f] text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                <img src={mascot} alt="Dora" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h3 className="font-medium text-sm leading-tight flex items-center gap-1">
                  Dora AI <Sparkles className="size-3 text-amber-300 fill-amber-300" />
                </h3>
                <span className="text-[10px] text-white/70">Your Travel Companion</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf5ee]/30 dark:bg-transparent"
          >
            {messages.length === 0 && (
              <div className="text-center py-12 px-4">
                <Bot className="size-8 mx-auto mb-2 text-[#6b316f]/60" />
                <h4 className="font-serif text-lg text-ink font-medium">Chat with Dora</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Ask me about local etiquette, transit directions, food, or translating any phrase!
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="size-6 rounded-full bg-[#faf5ee] border border-border flex-shrink-0 flex items-center justify-center mt-1">
                    <Bot className="size-3 text-[#6b316f]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#6b316f] text-white rounded-br-sm"
                      : "bg-[#faf5ee] text-ink rounded-bl-sm border border-border"
                  }`}
                >
                  {msg.role === "assistant" && actionBadge(msg.actionType)}
                  {msg.role === "assistant" ? (
                    <div className="food-prose">
                      <Suspense fallback={<Loader2 className="size-3 animate-spin" />}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      </Suspense>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2 justify-start">
                <div className="size-6 rounded-full bg-[#faf5ee] border border-border flex-shrink-0 flex items-center justify-center mt-1">
                  <Bot className="size-3 text-[#6b316f]" />
                </div>
                <div className="bg-[#faf5ee] text-ink rounded-xl rounded-bl-sm border border-border px-3 py-2 flex items-center gap-1">
                  <span className="size-1 rounded-full bg-ink/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-1 rounded-full bg-ink/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-1 rounded-full bg-ink/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-2 border-t border-border bg-card flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Dora..."
              className="flex-1 bg-[#faf5ee]/40 dark:bg-background border border-border rounded-xl py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-[#6b316f] focus:border-[#6b316f]"
              disabled={chatLoading}
            />
            <button
              onClick={handleToggleRecording}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${
                isRecording ? "bg-red-100 text-red-500 animate-pulse" : "bg-muted text-ink hover:bg-border/50"
              }`}
              title={isRecording ? "Stop Recording" : "Start Voice Chat"}
            >
              <Mic className="size-3.5" />
            </button>
            <button
              onClick={handleSend}
              disabled={chatLoading || !input.trim()}
              className="bg-[#6b316f] text-white p-2 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-[#5a295e] transition-colors"
            >
              {chatLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            </button>
            <audio ref={audioPlayerRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Floating Circle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-[#6b316f] bg-[#faf5ee] shadow-2xl cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#6b316f]/50"
        title="Chat with Dora AI"
      >
        <img
          src={mascot}
          alt="Dora AI"
          className="w-11 h-11 md:w-13 md:h-13 object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </button>
    </div>
  );
}
