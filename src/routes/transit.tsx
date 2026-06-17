import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Train, MapPin, Clock, Loader2, ArrowRight, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSessionStorage } from "@/hooks/useSessionStorage";

export const Route = createFileRoute("/transit")({
  head: () => ({
    meta: [
      { title: "Transit Guide — Dora AI" },
      { name: "description", content: "Complex transit, gently translated. Numbered, plain-language steps from A to B." },
    ],
  }),
  component: Transit,
});

type DirectionsResult = {
  source: string;
  directions: {
    origin: string;
    destination: string;
    city: string;
    totalDuration: string | null;
    totalDistance: string | null;
    simplifiedSteps: string[];
  };
};

const N8N_DIRECTIONS_URL = "http://localhost:5678/webhook/dora-directions";
const MAPS_API_KEY = "REMOVED_MAPS_KEY";

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    if (document.getElementById("gmap-script")) {
      const check = setInterval(() => {
        if (window.google?.maps) { clearInterval(check); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

function GoogleMap({ origin, destination, city }: { origin: string; destination: string; city: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const geocoder = new google.maps.Geocoder();

        const geocode = (address: string) =>
          new Promise<google.maps.LatLng>((res, rej) =>
            geocoder.geocode({ address: `${address}, ${city}` }, (results, status) => {
              if (status === "OK" && results?.[0]) res(results[0].geometry.location);
              else rej(new Error(`Could not geocode: ${address}`));
            })
          );

        const [originLatLng, destLatLng] = await Promise.all([
          geocode(origin),
          geocode(destination),
        ]);

        if (cancelled) return;

        const center = {
          lat: (originLatLng.lat() + destLatLng.lat()) / 2,
          lng: (originLatLng.lng() + destLatLng.lng()) / 2,
        };

        const map = new google.maps.Map(mapRef.current!, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
          ],
        });
        mapInstanceRef.current = map;

        new google.maps.Marker({
          position: originLatLng,
          map,
          label: { text: "A", color: "white" },
          title: origin,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4CAF50",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          },
        });

        new google.maps.Marker({
          position: destLatLng,
          map,
          label: { text: "B", color: "white" },
          title: destination,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#E53935",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          },
        });

        new google.maps.Polyline({
          path: [originLatLng, destLatLng],
          geodesic: true,
          strokeColor: "#2563EB",
          strokeOpacity: 0.6,
          strokeWeight: 3,
          map,
        });

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(originLatLng);
        bounds.extend(destLatLng);
        map.fitBounds(bounds, 60);

      } catch (err: any) {
        if (!cancelled) setMapError(err.message);
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, [origin, destination, city]);

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
        Map unavailable — {mapError}
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}

function Transit() {
  const [origin, setOrigin] = useState("Orchard MRT");
  const [destination, setDestination] = useState("Marina Bay Sands");
  const [city, setCity] = useState("Singapore");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useSessionStorage<DirectionsResult | null>("dora-transit-result", null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!origin.trim() || !destination.trim() || !city.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(N8N_DIRECTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: origin.trim(), destination: destination.trim(), city: city.trim() }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not fetch directions. Make sure n8n is running on localhost:5678.");
    } finally {
      setLoading(false);
    }
  }

  const steps = result?.directions?.simplifiedSteps ?? [];

  const mapsUrl = result
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(result.directions.origin + ", " + result.directions.city)}&destination=${encodeURIComponent(result.directions.destination + ", " + result.directions.city)}&travelmode=transit`
    : null;

  return (
    <AppShell>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-2xl">
          <span className="pill"><Train className="size-3" /> Live transit</span>
          <h1 className="font-serif text-6xl text-ink mt-4 leading-[1.05]">Your Simple Path</h1>
          <p className="mt-4 text-muted-foreground">
            Enter your origin, destination, and city to get plain-language step-by-step transit directions.
          </p>
        </div>

        {/* Search form */}
        <div className="glass-card mt-10 p-6 max-w-2xl grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">From</label>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. Orchard MRT"
                className="w-full mt-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-forename">To</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. Marina Bay Sands"
                className="w-full mt-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Singapore, Seoul, Bangkok"
              className="w-full mt-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            {loading
              ? <><Loader2 className="size-4 animate-spin" /> Getting directions…</>
              : <><ArrowRight className="size-4" /> Get directions</>
            }
          </button>
        </div>

        {error && (
          <div className="mt-6 max-w-2xl glass-card p-4 text-red-600 text-sm">{error}</div>
        )}

        {/* Results */}
        {result && steps.length > 0 && (
          <div className="mt-10 grid md:grid-cols-[1fr_1.2fr] gap-6">

            {/* Steps panel */}
            <div className="glass-card p-6">
              {result.directions.totalDuration && (
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3" /> Estimated travel time
                  </div>
                  <div className="font-serif text-2xl text-ink mt-1">
                    {result.directions.totalDuration}
                  </div>
                </div>
              )}

              <ol className="space-y-1">
                {steps.map((step, i) => (
                  <li key={i} className="relative pl-12 pb-6 last:pb-0">
                    <div className="absolute left-0 top-0 size-8 rounded-full bg-cream border border-border flex items-center justify-center font-serif text-ink text-sm">
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="absolute left-[15px] top-9 bottom-0 w-px bg-border" />
                    )}
                    <div className="text-sm text-muted-foreground mt-1 leading-relaxed pt-1">
                      {step.replace(/^\d+\.\s*/, "")}
                    </div>
                  </li>
                ))}
              </ol>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-ink underline"
                >
                  Open in Google Maps <ExternalLink className="size-4" />
                </a>
              )}

              {result.source === "cache" && (
                <span className="pill text-xs mt-4 block w-fit">Cached result</span>
              )}
            </div>

            {/* Google Map panel */}
            <div className="glass-card p-4 flex flex-col gap-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-3" /> Route overview
              </div>
              <div className="flex-1 rounded-lg overflow-hidden border border-border" style={{ minHeight: "420px" }}>
                <GoogleMap
                  origin={result.directions.origin}
                  destination={result.directions.destination}
                  city={result.directions.city}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Journey</div>
                  <div className="font-medium text-ink mt-0.5">
                    {result.directions.origin} → {result.directions.destination}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="mt-10 max-w-2xl text-center text-muted-foreground text-sm py-12">
            Enter your journey details above and Dora will simplify the route for you.
          </div>
        )}
      </section>
    </AppShell>
  );
}
