import { useEffect, useRef } from "react";

export function ScrollVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current || !videoRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const scrollDistance = rect.height - viewportHeight;
      let progress = -rect.top / scrollDistance;

      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      if (videoRef.current.duration) {
        const targetTime = progress * videoRef.current.duration;

        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = targetTime;
          }
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Initial calculation once video metadata is loaded
    const handleLoadedMetadata = () => {
      handleScroll();
    };
    
    if (videoRef.current) {
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (videoRef.current) {
        videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "400vh" }}>
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="/doravideo2.mp4"
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />
      </div>
    </div>
  );
}
