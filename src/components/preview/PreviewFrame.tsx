import { useEffect, useRef, useState } from "react";

type Props = {
  url: string;
};

export default function PreviewFrame({ url }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.27);
  const [interactive, setInteractive] = useState(false);
  const [loading, setLoading] = useState(true);

  const RENDER_W = 1280;
  const RENDER_H = 800;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      if (!containerRef.current) return;
      const newScale = containerRef.current.offsetWidth / RENDER_W;
      setScale((prev) => (Math.abs(prev - newScale) > 0.01 ? newScale : prev));
    };

    const frame = requestAnimationFrame(update);
    let ro: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener("resize", update);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", update);
    };
  }, []);

  const scaledHeight = Math.ceil(RENDER_H * scale);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-h-full"
      style={{ height: scaledHeight }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-xl border border-[#2a2a3a] bg-[#0f0f14] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {/* Top Bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1f] border-b border-[#2a2a3a]">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <div className="ml-3 text-xs text-gray-400 truncate flex-1">
            {url}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            {`Open &#8599;`}
          </a>
        </div>

        {/* Preview Area */}
        <div
          className="relative w-full"
          style={{ height: scaledHeight }}
          onMouseEnter={() => setInteractive(true)}
          onMouseLeave={() => setInteractive(false)}
        >
          <iframe
            src={url}
            title="Live Preview"
            loading="lazy"
            onLoad={() => setLoading(false)}
            style={{
              border: "none",
              width: `${RENDER_W}px`,
              height: `${RENDER_H}px`,
              display: "block",
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              transition: "transform 0.2s ease",
              pointerEvents: interactive ? "auto" : "none",
            }}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 bg-black/40 backdrop-blur-sm">
              Loading preview...
            </div>
          )}

          {!interactive && !loading && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 bg-black/30 backdrop-blur-sm">
              Click to interact
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(13,13,13,0.9))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
