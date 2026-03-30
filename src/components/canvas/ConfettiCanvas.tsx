import { useEffect, useRef } from "react";

export default function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    
    cancelAnimationFrame(rafRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    startRef.current = 0;

    type Piece = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      rot: number;
      rotV: number;
      w: number;
      h: number;
      color: string;
      shape: "rect" | "circle";
    };

    const colors = [
      "#6366f1",
      "#8b5cf6",
      "#06b6d4",
      "#34d399",
      "#fbbf24",
      "#f87171",
    ];

    const pieces: Piece[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * W,
      y: -10 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 2.5 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.18,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    const draw = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      ctx.clearRect(0, 0, W, H);

      let alive = false;

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07;
        p.rot += p.rotV;
        p.vx *= 0.995;

        if (p.y < H + 20) alive = true;

        const alpha = Math.max(0, 1 - elapsed / 3800);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (alive && elapsed < 4000) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
