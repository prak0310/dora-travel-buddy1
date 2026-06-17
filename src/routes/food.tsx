import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useRef, lazy, Suspense, memo } from "react";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { Loader2, MapPin, Search, Camera, UploadCloud, Download, ExternalLink } from "lucide-react";
import html2pdf from "html2pdf.js";
import remarkGfm from "remark-gfm";

// Lazy-load the heavy react-markdown bundle
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

export const Route = createFileRoute("/food")({
  head: () => ({
    meta: [
      { title: "Food Guide — Dora AI" },
      { name: "description", content: "Explore nearby food and analyze menus using Dora." },
    ],
  }),
  component: Food,
});

interface AgentResponse {
  mode: string;
  primary_headline: string;
  structured_recommendations: string;
}

/** Strip LLM reasoning/thinking artifacts that sometimes leak into the response */
function cleanResponse(raw: string): string {
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

function Food() {
  return (
    <AppShell>
      <FoodContent />
    </AppShell>
  );
}

const FoodContent = memo(function FoodContent() {
  const [tab, setTab] = useState<"explore" | "camera">("explore");
  
  // Uncontrolled Inputs
  const dietaryRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const cravingsRef = useRef<HTMLInputElement>(null);
  
  // Tab 2 Specific
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useSessionStorage<AgentResponse | null>("dora-food-result", null);
  const [error, setError] = useState("");

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (latRef.current) latRef.current.value = position.coords.latitude.toString();
          if (lngRef.current) lngRef.current.value = position.coords.longitude.toString();
        },
        (err) => {
          setError("Failed to get location: " + err.message);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleExploreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = latRef.current?.value;
    const lng = lngRef.current?.value;
    const address = addressRef.current?.value;

    if ((!lat || !lng) && !address) {
      setError("Please provide coordinates, use current location, or enter an address.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload: Record<string, unknown> = {
        latitude: lat ? parseFloat(lat) : 0,
        longitude: lng ? parseFloat(lng) : 0,
        dietary_restrictions: dietaryRef.current?.value ? dietaryRef.current.value.split(",").map(d => d.trim()) : [],
        budget: budgetRef.current?.value || "Flexible",
        cravings: cravingsRef.current?.value || "local",
        radius_meters: 1500
      };
      if (address) payload.address = address;

      const res = await fetch("http://localhost:8000/api/v1/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = latRef.current?.value;
    const lng = lngRef.current?.value;
    const address = addressRef.current?.value;

    if (!file) {
      setError("Please select an image file to upload.");
      return;
    }
    if ((!lat || !lng) && !address) {
      setError("Please provide coordinates, use current location, or enter an address.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const preferences: Record<string, unknown> = {
        latitude: lat ? parseFloat(lat) : 0,
        longitude: lng ? parseFloat(lng) : 0,
        dietary_restrictions: dietaryRef.current?.value ? dietaryRef.current.value.split(",").map(d => d.trim()) : [],
        budget: budgetRef.current?.value || "Flexible"
      };
      if (address) preferences.address = address;
      
      formData.append("preferences", JSON.stringify(preferences));

      const res = await fetch("http://localhost:8000/api/v1/camera-intel", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 pt-10 pb-20">
      <div className="text-center mb-10">
        <span className="pill">Food Guide</span>
        <h1 className="font-serif text-5xl text-ink mt-4">Discover & Translate</h1>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Find the perfect local dish matching your cravings or let Dora analyze a menu in front of you.
        </p>
      </div>

      {/* Global Shared State */}
      <div className="glass-card p-6 mb-8">
        <h2 className="font-serif text-2xl text-ink mb-4">Your Preferences</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Dietary Restrictions</label>
            <input 
              type="text" 
              ref={dietaryRef}
              placeholder="e.g. no beef, vegetarian"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Budget</label>
            <input 
              type="text" 
              ref={budgetRef}
              placeholder="e.g. SGD 50, Cheap, Fancy"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ink mb-1">Address <span className="text-muted-foreground font-normal">(optional — alternative to coordinates)</span></label>
            <input 
              type="text" 
              ref={addressRef}
              placeholder="e.g. Orchard Road, 179103, Shibuya Station"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ink mb-1">Location</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                ref={latRef}
                placeholder="Latitude"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input 
                type="text" 
                ref={lngRef}
                placeholder="Longitude"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button 
                type="button" 
                onClick={handleUseCurrentLocation}
                className="btn-ghost flex-shrink-0"
              >
                <MapPin className="size-4" /> Use Current Location
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button 
          onClick={() => { setTab("explore"); setError(""); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "explore" ? "text-ink border-b-2 border-ink" : "text-muted-foreground hover:text-ink"}`}
        >
          Explore Nearby
        </button>
        <button 
          onClick={() => { setTab("camera"); setError(""); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "camera" ? "text-ink border-b-2 border-ink" : "text-muted-foreground hover:text-ink"}`}
        >
          Camera Intel
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-md text-sm" style={{ background: '#fde8e8', color: '#9b2c2c', border: '1px solid #f5c6c6' }}>
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="glass-card p-6 mb-8">
        {tab === "explore" && (
          <form onSubmit={handleExploreSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink mb-1">Cravings</label>
              <input 
                type="text" 
                ref={cravingsRef}
                placeholder="e.g. ramen, authentic local food, sushi"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button disabled={loading} type="submit" className="btn-primary w-full disabled:opacity-50">
              {loading ? <><Loader2 className="size-4 animate-spin" /> Searching...</> : <><Search className="size-4" /> Find Restaurants</>}
            </button>
          </form>
        )}

        {tab === "camera" && (
          <form onSubmit={handleCameraSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink mb-1">Upload Menu or Storefront Image</label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-cream/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const selected = e.target.files[0];
                      setFile(selected);
                      setImagePreviewUrl(URL.createObjectURL(selected));
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <UploadCloud className="size-8 mb-2" />
                  {file ? (
                    <span className="font-medium text-ink">{file.name}</span>
                  ) : (
                    <span>Click to upload an image</span>
                  )}
                </div>
              </div>
            </div>
            <button disabled={loading} type="submit" className="btn-primary w-full disabled:opacity-50">
              {loading ? <><Loader2 className="size-4 animate-spin" /> Analyzing...</> : <><Camera className="size-4" /> Analyze Image</>}
            </button>
          </form>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-3xl text-ink">{result.primary_headline}</h3>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById("pdf-content");
                // Build a filesystem-safe filename from the headline
                const safeName = result.primary_headline
                  .replace(/[^a-zA-Z0-9\s-]/g, "")
                  .trim()
                  .replace(/\s+/g, "_")
                  .toLowerCase()
                  || "dora_food_guide";
                // Inject an override stylesheet to strip oklch from the live DOM before html2canvas reads it
                const overrideStyle = document.createElement("style");
                overrideStyle.id = "pdf-override";
                overrideStyle.textContent = `
                  #pdf-content .glass-card {
                    background-color: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    box-shadow: none !important;
                  }
                  #pdf-content .food-prose,
                  #pdf-content .food-prose * {
                    color: #1f2937 !important;
                    border-color: #e5e7eb !important;
                  }
                  #pdf-content .food-prose code,
                  #pdf-content .food-prose pre,
                  #pdf-content .food-prose th,
                  #pdf-content .food-prose blockquote {
                    background-color: #f3f4f6 !important;
                  }
                `;
                document.head.appendChild(overrideStyle);

                const opt = {
                  margin: 10,
                  filename: `dora_${safeName}.pdf`,
                  image: { type: "jpeg", quality: 0.98 },
                  html2canvas: {
                    scale: 2,
                    useCORS: true,
                    onclone: (clonedDoc: Document) => {
                      // Remove stylesheets in the clone to prevent parsing errors
                      clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
                      
                      const safeStyle = clonedDoc.createElement("style");
                      safeStyle.textContent = `
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { background: #ffffff; color: #1f2937; font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; }
                        #pdf-content { background: #ffffff; color: #1f2937; padding: 16px; }
                        .glass-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: none; }
                        h1, h2, h3, h4, h5, h6 { color: #111827; margin: 1em 0 0.5em; font-family: Georgia, 'Times New Roman', serif; }
                        h1 { font-size: 1.8em; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; }
                        p { margin: 0.5em 0; }
                        ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
                        li { margin: 0.25em 0; }
                        strong { font-weight: bold; } em { font-style: italic; }
                        a { color: #2563eb; text-decoration: underline; }
                        hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
                        img { max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; }
                        table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
                        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                        th { background: #f3f4f6; font-weight: bold; }
                        code { background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
                        pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
                        blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #6b7280; margin: 0.5em 0; background: #f3f4f6; }
                        .mb-6 { margin-bottom: 24px; }
                        .food-prose { color: #1f2937; }
                      `;
                      clonedDoc.head.appendChild(safeStyle);
                    }
                  },
                  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
                };
                html2pdf().set(opt).from(element).save().finally(() => {
                  document.head.removeChild(overrideStyle);
                });
              }}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Download className="size-4" /> Download as PDF
            </button>
          </div>
          <div id="pdf-content" style={{ background: '#ffffff', color: '#2d2a26' }}>
            {imagePreviewUrl && (
              <div className="mb-6">
                <img
                  src={imagePreviewUrl}
                  alt="Uploaded image"
                  className="max-h-80 rounded-lg object-contain mx-auto"
                />
              </div>
            )}
            <div className="glass-card p-8" style={{ background: '#ffffff', backdropFilter: 'none', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <div className="food-prose">
                <Suspense fallback={<div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="size-4 animate-spin" /> Rendering results…</div>}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{cleanResponse(result.structured_recommendations)}</ReactMarkdown>
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
