import { useEffect, useRef } from "react";

export default function DeployCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    let W = 0;
    let H = 0;

    type Ring = {
      x: number;
      y: number;
      r: number;
      phase: number;
      speed: number;
      hue: number;
    };

    let rings: Ring[] = [];

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;

      canvas.width = W * dpr;
      canvas.height = H * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      rings = Array.from({ length: 6 }, (_, i) => ({
        x: W * 0.5,
        y: H * 0.5,
        r: 40 + i * 38,
        phase: (i / 6) * Math.PI * 2,
        speed: 0.4 + i * 0.07,
        hue: 220 + i * 18,
      }));
    };

    const draw = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;

      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.8,
      );
      bg.addColorStop(0, "#0d0f1a");
      bg.addColorStop(1, "#07080f");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Rings animation
      rings.forEach((ring) => {
        const pulse = Math.sin(t * ring.speed + ring.phase);
        const r = ring.r + pulse * 6;

        ctx.beginPath();
        ctx.arc(ring.x, ring.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${ring.hue}, 70%, 65%, ${0.06 + pulse * 0.03})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Scanline effect
      const scanY = ((t * 22) % (H + 40)) - 20;

      const sg = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      sg.addColorStop(0, "transparent");
      sg.addColorStop(0.5, "rgba(120,100,255,0.03)");
      sg.addColorStop(1, "transparent");

      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY - 20, W, 40);

      rafRef.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(rafRef.current);

    // Initial setup
    resize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    }

    window.addEventListener("resize", resize);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
