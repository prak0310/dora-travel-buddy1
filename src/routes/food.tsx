import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useRef, lazy, Suspense, memo } from "react";
import { Loader2, MapPin, Search, Camera, UploadCloud } from "lucide-react";

// Lazy-load the heavy react-markdown bundle (pulls in remark + micromark)
// so it never blocks the main thread during page interaction.
const ReactMarkdown = lazy(() => import("react-markdown"));

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
  const cravingsRef = useRef<HTMLInputElement>(null);
  
  // Tab 2 Specific
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
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

    if (!lat || !lng) {
      setError("Please provide coordinates or use current location.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        dietary_restrictions: dietaryRef.current?.value ? dietaryRef.current.value.split(",").map(d => d.trim()) : [],
        budget: budgetRef.current?.value || "Flexible",
        cravings: cravingsRef.current?.value || "local",
        radius_meters: 1500
      };

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

    if (!file) {
      setError("Please select an image file to upload.");
      return;
    }
    if (!lat || !lng) {
      setError("Please provide coordinates or use current location.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const preferences = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        dietary_restrictions: dietaryRef.current?.value ? dietaryRef.current.value.split(",").map(d => d.trim()) : [],
        budget: budgetRef.current?.value || "Flexible"
      };
      
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
          onClick={() => { setTab("explore"); setResult(null); setError(""); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "explore" ? "text-ink border-b-2 border-ink" : "text-muted-foreground hover:text-ink"}`}
        >
          Explore Nearby
        </button>
        <button 
          onClick={() => { setTab("camera"); setResult(null); setError(""); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "camera" ? "text-ink border-b-2 border-ink" : "text-muted-foreground hover:text-ink"}`}
        >
          Camera Intel
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-md bg-[oklch(0.9_0.05_30)] text-[oklch(0.4_0.15_30)] text-sm border border-[oklch(0.8_0.05_30)]">
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
                      setFile(e.target.files[0]);
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
          <h3 className="font-serif text-3xl text-ink mb-6">{result.primary_headline}</h3>
          <div className="glass-card p-8">
            <div className="food-prose">
              <Suspense fallback={<div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="size-4 animate-spin" /> Rendering results…</div>}>
                <ReactMarkdown>{result.structured_recommendations}</ReactMarkdown>
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
