import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ScanLine, Route as RouteIcon, ShieldCheck, Camera, ArrowRight, ChevronDown } from "lucide-react";

const features = [
  {
    to: "/fact-check",
    icon: ShieldCheck,
    title: "Fact-Check Explorer",
    desc: "Ask about any attraction, restaurant, or place to stay and get up-to-date, verified information pulled from the latest travel trends. Great for finding hidden gems or checking if somewhere is actually worth the hype.",
    cta: "Start wandering",
  },
  {
    to: "/transit",
    icon: RouteIcon,
    title: "Transit Explorer",
    desc: "Tell Dora where you're headed and get a step-by-step transit guide with a map view, broken down in plain language.",
    cta: "View routes",
  },
  {
    to: "/food",
    icon: ScanLine,
    title: "Food Explorer",
    desc: "Upload a photo of a menu or restaurant front to get personalised dish recommendations based on your budget and dietary needs. Or share your location to discover what's good nearby.",
    cta: "Open tool",
  },
  {
    to: "/cultural",
    icon: Camera,
    title: "Cultural Explorer",
    desc: "Point your camera at anything around you — a landmark, sign, banner, or poster — and get the cultural backstory, local etiquette, useful phrases, and how to say them out loud.",
    cta: "Open camera",
  },
];


const featureRanges = [
  { start: 0.02, end: 0.15 },
  { start: 0.24, end: 0.38 },
  { start: 0.45, end: 0.68 },
  { start: 0.74, end: 0.90 },
];

export function ScrollVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const targetTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => {
      if (!video) return;
      const target = targetTimeRef.current;
      // If scroll position changed since the last seek started, update the playhead
      if (Math.abs(video.currentTime - target) > 0.01) {
        video.currentTime = target;
      }
    };

    const handleScroll = () => {
      if (!containerRef.current || !video) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const headerHeight = 64; // Height of sticky header

      const scrollDistance = rect.height - (viewportHeight - headerHeight);
      let progress = (headerHeight - rect.top) / scrollDistance;

      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      setScrollProgress(progress);

      if (video.duration) {
        const targetTime = progress * video.duration;
        targetTimeRef.current = targetTime;

        // Direct seek immediately if not already seeking, preventing decoder backlog
        if (!video.seeking) {
          video.currentTime = targetTime;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    video.addEventListener("seeked", handleSeeked);

    const handleLoadedMetadata = () => {
      handleScroll();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    if (video.readyState >= 1) {
      handleScroll();
    }

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (video) {
        video.removeEventListener("seeked", handleSeeked);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      }
    };
  }, []);

  const handleTimelineClick = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const viewportHeight = window.innerHeight;
    const scrollDistance = containerRef.current.offsetHeight - viewportHeight;

    const range = featureRanges[index];
    const targetProgress = (range.start + range.end) / 2;
    const targetScroll = absoluteTop + targetProgress * scrollDistance;

    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  const showHint = scrollProgress < 0.02;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "450vh" }}>
      <div className="sticky top-16 w-full h-[calc(100vh-4rem)] overflow-hidden bg-black flex items-center justify-center">
        {/* Darkened Video Background */}
        <video
          ref={videoRef}
          src="/nice_but_i_want_dore_and_in_d.mp4"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          muted
          playsInline
          preload="auto"
        />

        {/* Floating Interactive Elements Overlay */}
        <div className="absolute inset-0 z-10 w-full max-w-6xl mx-auto px-6 flex items-center justify-between pointer-events-none">

          {/* Vertical Timeline Step Indicator (Desktop Only) */}
          <div className="hidden md:flex flex-col gap-8 pointer-events-auto relative pl-4 border-l border-white/10 py-4">
            {features.map((f, i) => {
              const range = featureRanges[i];
              const isActive = scrollProgress >= range.start && scrollProgress <= range.end;
              const isPast = scrollProgress > range.end;

              return (
                <button
                  key={i}
                  onClick={() => handleTimelineClick(i)}
                  className="group flex items-center gap-4 text-left focus:outline-none transition-all duration-300"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Ring Glow on Active */}
                    {isActive && (
                      <span className="absolute size-5 rounded-full bg-white/20 animate-ping" />
                    )}
                    {/* Circle Dot */}
                    <div
                      className={`size-3 rounded-full border transition-all duration-300 ${isActive
                        ? "bg-white border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        : isPast
                          ? "bg-white/60 border-white/60"
                          : "bg-transparent border-white/30 group-hover:border-white/60"
                        }`}
                    />
                  </div>

                  {/* Step Info */}
                  <div className="flex flex-col">
                    <span
                      className={`text-[9px] font-mono tracking-widest uppercase transition-all ${isActive ? "text-white/80" : "text-white/30"
                        }`}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold tracking-wider transition-all ${isActive
                        ? "text-white translate-x-1"
                        : "text-white/40 group-hover:text-white/75 translate-x-0"
                        }`}
                    >
                      {f.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cards Wrapper (Responsive Position: bottom on mobile, absolute screen positions on desktop) */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            {features.map((f, i) => {
              const range = featureRanges[i];
              const isActive = scrollProgress >= range.start && scrollProgress <= range.end;

              // Calculate segment progress for the card progress bar
              const rangeProgress = (scrollProgress - range.start) / (range.end - range.start);
              const clampedRangeProgress = Math.max(0, Math.min(1, rangeProgress));

              // Determine specific absolute positioning on desktop for each card
              let positionClasses = "";
              if (i === 0) {
                // Feature 1: move up but vertically in the middle (shifted ~10% right)
                positionClasses = "left-6 right-6 bottom-16 md:bottom-auto md:left-[60%] md:top-[42%] md:-translate-x-1/2 md:-translate-y-1/2 md:right-auto w-auto md:w-[420px]";
              } else if (i === 1) {
                // Feature 2: kinda bottom right (shifted ~10% right)
                positionClasses = "left-6 right-6 bottom-16 md:bottom-16 md:-right-16 md:top-auto md:left-auto w-auto md:w-[420px]";
              } else if (i === 2) {
                // Feature 3: kinda top right (shifted ~10% right)
                positionClasses = "left-6 right-6 bottom-16 md:top-24 md:-right-16 md:bottom-auto md:left-auto w-auto md:w-[420px]";
              } else if (i === 3) {
                // Feature 4: kinda bottom right (shifted ~10% right)
                positionClasses = "left-6 right-6 bottom-16 md:bottom-16 md:-right-16 md:top-auto md:left-auto w-auto md:w-[420px]";
              }

              return (
                <div
                  key={i}
                  className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${positionClasses} ${isActive
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                    }`}
                >
                  {/* Nested container to animate translation and scale without conflicting with layout transforms */}
                  <div
                    className={`w-full transition-all duration-500 transform ${isActive
                      ? "translate-y-0 scale-100"
                      : "translate-y-6 scale-95"
                      }`}
                  >
                    <div className="glass-card p-6 md:p-8 bg-black/45 backdrop-blur-xl border border-white/15 text-white shadow-2xl flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                          <f.icon className="size-5 text-white" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold font-mono">
                            Explore Feature 0{i + 1}
                          </span>
                          <h3 className="font-serif text-2xl md:text-3xl text-white font-medium leading-tight">
                            {f.title}
                          </h3>
                        </div>
                      </div>

                      {/* Divider Line */}
                      <hr className="border-white/10 my-0.5" />

                      {/* Description */}
                      <p className="text-xs md:text-sm text-white/80 leading-relaxed font-light">
                        {f.desc}
                      </p>

                      {/* Card Progress Indicator (Visual Delight) */}
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-white transition-all duration-75"
                          style={{ width: `${clampedRangeProgress * 100}%` }}
                        />
                      </div>

                      {/* CTA Action */}
                      <div className="mt-2 flex">
                        <Link
                          to={f.to}
                          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all shadow-lg hover:shadow-white/10 active:scale-95"
                        >
                          {f.cta}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Scroll Bouncing Hint */}
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 transition-opacity duration-500 pointer-events-none ${showHint ? "opacity-100 animate-pulse" : "opacity-0"
            }`}
        >
          <span className="text-[10px] uppercase tracking-widest font-bold font-mono">
            Scroll to walk with Dora
          </span>
          <ChevronDown className="size-4 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
