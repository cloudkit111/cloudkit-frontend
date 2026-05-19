import { useEffect, useRef } from "react";

const CloudCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const startRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const dpr = window.devicePixelRatio || 1;

        type Particle = {
            x: number;
            y: number;
            vx: number;
            vy: number;
            r: number;
            hue: number;
            alpha: number;
            pulse: number;
        };

        type Cloud = {
            x: number;
            y: number;
            vx: number;
            w: number;
            h: number;
            hue: number;
            alpha: number;
        };

        let particles: Particle[] = [];
        let clouds: Cloud[] = [];
        let W = 0,
            H = 0;

        const resize = () => {
            W = canvas.offsetWidth;
            H = canvas.offsetHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            const ctx = canvas.getContext('2d')!;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            init();
        };

        const init = () => {
            clouds = Array.from({ length: 5 }, (_, i) => ({
                x: (i / 4) * W * 1.2 - W * 0.1,
                y: H * 0.3 + Math.random() * H * 0.4,
                vx: 0.18 + Math.random() * 0.12,
                w: W * (0.18 + Math.random() * 0.14),
                h: H * (0.22 + Math.random() * 0.18),
                hue: 200 + Math.random() * 60,
                alpha: 0.1 + Math.random() * 0.08,
            }));

            particles = Array.from({ length: 55 }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.28,
                vy: (Math.random() - 0.5) * 0.22,
                r: 0.8 + Math.random() * 1.6,
                hue: 210 + Math.random() * 80,
                alpha: 0.25 + Math.random() * 0.55,
                pulse: Math.random() * Math.PI * 2,
            }));
        };

        const draw = (ts: number) => {
            if (!startRef.current) startRef.current = ts;
            const t = (ts - startRef.current) / 1000;

            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, W, H);

            const bgG = ctx.createLinearGradient(0, 0, W, H);
            bgG.addColorStop(0, '#07080f');
            bgG.addColorStop(0.5, '#090b16');
            bgG.addColorStop(1, '#06080c');
            ctx.fillStyle = bgG;
            ctx.fillRect(0, 0, W, H);

            clouds.forEach((c) => {
                c.x += c.vx;
                if (c.x - c.w > W) c.x = -c.w;

                const bobY = c.y + Math.sin(t * 0.25 + c.hue) * H * 0.04;

                const g = ctx.createRadialGradient(
                    c.x,
                    bobY,
                    0,
                    c.x,
                    bobY,
                    Math.max(c.w, c.h),
                );
                g.addColorStop(0, `hsla(${c.hue}, 80%, 62%, ${c.alpha})`);
                g.addColorStop(0.45, `hsla(${c.hue}, 70%, 45%, ${c.alpha * 0.5})`);
                g.addColorStop(1, `hsla(${c.hue}, 60%, 30%, 0)`);

                ctx.save();
                ctx.scale(1, c.h / c.w);
                ctx.beginPath();
                ctx.arc(c.x, bobY * (c.w / c.h), c.w, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
                ctx.restore();
            });

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 85) {
                        const alpha = (1 - d / 85) * 0.14;
                        ctx.strokeStyle = `hsla(${(particles[i].hue + particles[j].hue) / 2}, 70%, 75%, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = W;
                if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H;
                if (p.y > H) p.y = 0;

                const a = p.alpha * (0.7 + 0.3 * Math.sin(t * 1.2 + p.pulse));
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
                grd.addColorStop(0, `hsla(${p.hue}, 80%, 85%, ${a})`);
                grd.addColorStop(1, 'transparent');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `hsla(${p.hue}, 90%, 95%, ${a * 1.3})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });

            const scanY = ((t * 28) % (H + 40)) - 20;
            const scanG = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
            scanG.addColorStop(0, 'transparent');
            scanG.addColorStop(0.5, 'rgba(160,140,255,0.035)');
            scanG.addColorStop(1, 'transparent');
            ctx.fillStyle = scanG;
            ctx.fillRect(0, scanY - 20, W, 40);

            rafRef.current = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ display: 'block' }}
        />
    );
}

export default CloudCanvas;