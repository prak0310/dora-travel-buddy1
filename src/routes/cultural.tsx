import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useRef, lazy, Suspense } from "react";
import { Loader2, Camera, UploadCloud, ExternalLink } from "lucide-react";
import remarkGfm from "remark-gfm";

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

/** Strip LLM reasoning/thinking artifacts that sometimes leak into the response */
function cleanResponse(raw: string): string {
  if (!raw) return "";
  let text = raw;

  // Remove <reasoning>...</reasoning> blocks (greedy, handles multi-line)
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");

  // If there's an orphaned </reasoning> tag, discard everything before (and including) it
  const idx = text.lastIndexOf("</reasoning>");
  if (idx !== -1) {
    text = text.substring(idx + "</reasoning>".length);
  }

  // Also strip orphaned <reasoning> opening tag if the close was already removed
  text = text.replace(/<\/?reasoning>/gi, "");

  // Remove lines that are purely URL-encoded noise (90%+ percent-encoded chars)
  text = text
    .split("\n")
    .filter((line) => {
      const pctMatches = line.match(/%[0-9A-Fa-f]{2}/g);
      if (pctMatches && pctMatches.length > 10 && (pctMatches.length * 3) / line.length > 0.4) {
        return false; // line is mostly URL-encoded junk
      }
      return true;
    })
    .join("\n");

  return text.trim();
}

export const Route = createFileRoute("/cultural")({
  head: () => ({
    meta: [
      { title: "Cultural Guide — Dora AI" },
      { name: "description", content: "Analyze cultural scenes using Dora AI." },
    ],
  }),
  component: Cultural,
});

type SceneResponse = {
  translation_and_context: string;
  customs_and_etiquette: string;
  slang_phrase: string;
  slang_explanation: string;
  slang_audio_base64: string;
};

function Cultural() {
  return (
    <AppShell>
      <CulturalContent />
    </AppShell>
  );
}

function CulturalContent() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SceneResponse | null>(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload an image.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const base64 = await convertToBase64(file);

      
      const res = await fetch("http://127.0.0.1:8000/api/v1/analyze-scene", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
        image_base64: base64,
        location: "Singapore",
        }),
        }
    );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error ${res.status}: ${text}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("FULL ERROR:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-6 pt-10 pb-20">
      <div className="text-center mb-10">
        <span className="pill">Cultural Guide</span>
        <h1 className="font-serif text-5xl text-ink mt-4">
          Understand What You See
        </h1>
        <p className="text-muted-foreground mt-3">
          Upload a photo of a place, sign, or monument and Dora will explain it.
        </p>
      </div>

      {/* Upload Box */}
      <div className="glass-card p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-cream/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />

            <UploadCloud className="size-8 mx-auto mb-2 text-muted-foreground" />

            {file ? (
              <p className="font-medium text-ink">{file.name}</p>
            ) : (
              <p className="text-muted-foreground">
                Click to upload an image
              </p>
            )}
          </div>

          <button
            disabled={loading}
            type="submit"
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Camera className="size-4" />
                Analyze Scene
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-4 rounded-md bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="glass-card p-6 space-y-6">
          <div className="food-prose">
            <h2 className="font-semibold text-lg">Context</h2>
            <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {cleanResponse(result.translation_and_context)}
              </ReactMarkdown>
            </Suspense>
          </div>

          <div className="food-prose">
            <h2 className="font-semibold text-lg">Customs & Etiquette</h2>
            <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {cleanResponse(result.customs_and_etiquette)}
              </ReactMarkdown>
            </Suspense>
          </div>

          <div className="food-prose">
            <h2 className="font-semibold text-lg">Local Slang</h2>
            <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {cleanResponse(result.slang_phrase)
                  .replace(/\s*\*\*(Translation|When to [Uu]se):\*\*\s*/g, '\n\n**$1:** ')
                  .replace(/\s*\*([Nn]ote):\s*/g, '\n\n*$1: ')}
              </ReactMarkdown>
            </Suspense>
            {result.slang_explanation && !result.slang_explanation.toLowerCase().includes("information not provided") && (
              <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {cleanResponse(result.slang_explanation)}
                </ReactMarkdown>
              </Suspense>
            )}
          </div>

          {/* Audio */}
          {result.slang_audio_base64 && (
            <div>
              <h2 className="font-semibold text-lg mb-2">Listen</h2>
              <audio controls src={result.slang_audio_base64} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
