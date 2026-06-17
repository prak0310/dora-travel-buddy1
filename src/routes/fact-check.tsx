import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import {
  Loader2,
  Search,
  Star,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { N8N_URL } from "../config";

export const Route = createFileRoute("/fact-check")({
  head: () => ({
    meta: [
      { title: "Fact-Check Explore — Dora AI" },
      {
        name: "description",
        content:
          "Trending travel content, cross-verified with real reviews. Skip the overhyped tourist traps.",
      },
    ],
  }),
  component: FactCheck,
});

type Category = "food" | "transport" | "activity" | "accommodation";

type Recommendation = {
  id?: string;
  title?: string;
  verdict?: string;
  confidence?: number;
  rating?: number;
  reviewCount?: number;
  review_count?: number;
  summary?: string;
  url?: string;
  watchOut?: string[];
  watch_out?: string[];
  tips?: string[];

  transport_type?: string;
  transportType?: string;
  route?: string;
  approximate_cost?: string;
  approximateCost?: string;
  duration?: string;
  ease_of_use?: string;
  easeOfUse?: string;

  priceRange?: string;
  price_range?: string;
  locationQuality?: string;
  location_quality?: string;
  goodFor?: string[];
  good_for?: string[];
  amenities?: string[];

  bestTime?: string;
  best_time?: string;
  category?: string;
  ageSuitability?: string;
  age_suitability?: string;
  indoorOutdoor?: string;
  indoor_outdoor?: string;
  accessibility?: string;
};

const endpointMap: Record<Category, string> = {
  food: `${N8N_URL}/webhook/dora-social-check`,
  transport: `${N8N_URL}/webhook/dora-transport-check`,
  activity: `${N8N_URL}/webhook/dora-activity-check`,
  accommodation: `${N8N_URL}/webhook/dora-accommodation-check`,
};

function FactCheck() {
  const [category, setCategory] = useState<Category>("transport");
  const [destination, setDestination] = useState("Tokyo");
  const [query, setQuery] = useState("how to get around");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [recommendations, setRecommendations] = useSessionStorage<Recommendation[]>("dora-fact-check", []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSource("");
    setRecommendations([]);

    try {
      const res = await fetch(endpointMap[category], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          query,
        }),
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.recommendations || !Array.isArray(data.recommendations)) {
        throw new Error("Backend did not return recommendations.");
      }

      setRecommendations(data.recommendations);
      setSource(data.source || "live_check");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-3xl">
          <span className="pill">
            <ShieldCheck className="size-3" /> AI trust layer
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-ink mt-4 leading-[1.05]">
            The Fact-Check Feed
          </h1>

          <p className="mt-4 text-muted-foreground">
            Dora checks travel recommendations against live search results,
            Google Places data, Reka reasoning, and cached Supabase results.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 mt-10">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="activity">Activity</option>
                <option value="accommodation">Accommodation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Destination
              </label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tokyo"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                What should Dora check?
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. how to get around"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="btn-primary w-full mt-5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Checking...
              </>
            ) : (
              <>
                <Search className="size-4" /> Fact-check recommendation
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-md border text-sm text-[oklch(0.45_0.15_30)] bg-[oklch(0.94_0.04_30)]">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4" />
              Dora could not complete this check.
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {source && (
          <p className="mt-6 text-sm text-muted-foreground">
            Source:{" "}
            {source === "supabase_cache"
              ? "Supabase cache"
              : "Live AI check"}
          </p>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-5">
          {recommendations.map((item, index) => {
            const reviewCount = item.reviewCount ?? item.review_count;
            const watchOut = item.watchOut ?? item.watch_out ?? [];
            const goodFor = item.goodFor ?? item.good_for ?? [];
            const priceRange = item.priceRange ?? item.price_range;
            const bestTime = item.bestTime ?? item.best_time;
            const locationQuality =
              item.locationQuality ?? item.location_quality;
            const ageSuitability =
              item.ageSuitability ?? item.age_suitability;
            const indoorOutdoor = item.indoorOutdoor ?? item.indoor_outdoor;

            return (
              <article key={item.id || index} className="glass-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {item.verdict && <span className="pill">{item.verdict}</span>}
                    <h3 className="font-serif text-2xl text-ink mt-3">
                      {item.title || "Untitled recommendation"}
                    </h3>
                  </div>

                  {item.confidence != null && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  )}
                </div>

                {item.summary && (
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    {item.summary}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {item.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="size-4" />
                      {item.rating} rating
                      {reviewCount ? ` · ${reviewCount} reviews` : ""}
                    </div>
                  )}

                  {(item.transport_type || item.transportType) && (
                    <div>
                      Transport: {item.transport_type || item.transportType}
                    </div>
                  )}

                  {item.route && <div>Route: {item.route}</div>}

                  {(item.approximate_cost || item.approximateCost) && (
                    <div>
                      Cost: {item.approximate_cost || item.approximateCost}
                    </div>
                  )}

                  {item.duration && <div>Duration: {item.duration}</div>}

                  {(item.ease_of_use || item.easeOfUse) && (
                    <div>Ease: {item.ease_of_use || item.easeOfUse}</div>
                  )}

                  {priceRange && <div>Price: {priceRange}</div>}

                  {locationQuality && <div>Location: {locationQuality}</div>}

                  {bestTime && <div>Best time: {bestTime}</div>}

                  {item.category && <div>Type: {item.category}</div>}

                  {ageSuitability && <div>Age suitability: {ageSuitability}</div>}

                  {indoorOutdoor && <div>Setting: {indoorOutdoor}</div>}

                  {item.accessibility && (
                    <div>Accessibility: {item.accessibility}</div>
                  )}
                </div>

                {goodFor.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-ink text-sm">Good for</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {goodFor.map((tag, i) => (
                        <span key={i} className="pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.amenities && item.amenities.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-ink text-sm">Amenities</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.amenities.map((tag, i) => (
                        <span key={i} className="pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.tips && item.tips.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-ink text-sm">Tips</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1 space-y-1">
                      {item.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {watchOut.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-ink text-sm">Watch out</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1 space-y-1">
                      {watchOut.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-ink underline"
                  >
                    Open source <ExternalLink className="size-4" />
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}