/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import logo from "./assets/cloudkit.png";

// ── Cloud / floating orbs canvas animation ────────────────────────────────

function CloudCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;

    // --- particle data ---
    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number; // radius
      hue: number;
      alpha: number;
      pulse: number; // personal phase offset
    };

    type Cloud = {
      x: number;
      y: number;
      vx: number;
      w: number;
      h: number; // semi-axes
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
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };

    const init = () => {
      // soft glowing cloud blobs
      clouds = Array.from({ length: 5 }, (_, i) => ({
        x: (i / 4) * W * 1.2 - W * 0.1,
        y: H * 0.3 + Math.random() * H * 0.4,
        vx: 0.18 + Math.random() * 0.12,
        w: W * (0.18 + Math.random() * 0.14),
        h: H * (0.22 + Math.random() * 0.18),
        hue: 200 + Math.random() * 60, // blue → violet
        alpha: 0.1 + Math.random() * 0.08,
      }));

      // tiny star-like floating particles
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

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);

      // ── background gradient ──────────────────────────────────────────
      const bgG = ctx.createLinearGradient(0, 0, W, H);
      bgG.addColorStop(0, "#07080f");
      bgG.addColorStop(0.5, "#090b16");
      bgG.addColorStop(1, "#06080c");
      ctx.fillStyle = bgG;
      ctx.fillRect(0, 0, W, H);

      // ── drifting cloud blobs ─────────────────────────────────────────
      clouds.forEach((c) => {
        c.x += c.vx;
        if (c.x - c.w > W) c.x = -c.w; // wrap around

        // slow vertical bob
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
        ctx.scale(1, c.h / c.w); // squash into ellipse
        ctx.beginPath();
        ctx.arc(c.x, bobY * (c.w / c.h), c.w, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      });

      // ── connection lines between nearby particles ────────────────────
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

      // ── particles ────────────────────────────────────────────────────
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
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue}, 90%, 95%, ${a * 1.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── subtle horizontal scan line shimmer ──────────────────────────
      const scanY = ((t * 28) % (H + 40)) - 20;
      const scanG = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanG.addColorStop(0, "transparent");
      scanG.addColorStop(0.5, "rgba(160,140,255,0.035)");
      scanG.addColorStop(1, "transparent");
      ctx.fillStyle = scanG;
      ctx.fillRect(0, scanY - 20, W, 40);

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ display: "block" }}
    />
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export default function DashboardPage() {
  const [repos, setRepos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [page, setPage] = useState(0); // 0-indexed
  const [search, setSearch] = useState("");

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URI}/auth/me`,
        {
          withCredentials: true,
        },
      );
      setUser(res.data);
      setRepos(res.data.repos || []);
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BACKEND_URI}/auth/logout`, {
        withCredentials: true,
      });
      window.location.href = "/";
    } catch (err) {
      console.log(err);
    }
  };

  const navigate = useNavigate();

  const handleImport = (repo: any) => {
    try {
      if (sessionStorage.getItem("deployment_url")) {
        sessionStorage.removeItem("deployment_url");
      }
      sessionStorage.setItem("deployment_url", repo?.clone_url);
      navigate("/deploy-project");
    } catch (error) {
      console.log(`Error during handling import ${error}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const totalPages = Math.ceil(repos.length / PAGE_SIZE);
  const filteredRepos = repos.filter((r: any) =>
    r.name?.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredPages = Math.ceil(filteredRepos.length / PAGE_SIZE);
  const visibleRepos = filteredRepos.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  const initials = user
    ? user.fullname
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <>
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-dropIn { animation: dropIn 0.15s ease; }
        .animate-shimmer {
          background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      <div
        className="min-h-screen bg-[#0a0a0a] text-[#ededed]"
        style={{
          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
        onClick={() => showUserMenu && setShowUserMenu(false)}
      >
        {/* ── Topbar ── */}
        <header className="h-14 border-b border-[#1f1f1f] flex items-center justify-between px-6 sticky top-0 z-50 bg-[rgba(10,10,10,0.85)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-black bg-gradient-to-br from-white to-[#888]">
              <img src={logo} alt="error" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#ededed]">
              cloudKit
            </span>
          </div>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-transparent bg-transparent text-[#ededed] cursor-pointer transition-all duration-150 hover:bg-[#1a1a1a] hover:border-[#2a2a2a]"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={initials}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-medium text-[#ededed]">
                  {user?.fullname ?? "Loading…"}
                </span>
                <span className="text-[11px] text-[#666]">
                  {user?.email ?? ""}
                </span>
              </div>
              <span
                className="text-[10px] text-[#555] transition-transform duration-200"
                style={{
                  display: "inline-block",
                  transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </button>

            {showUserMenu && (
              <div className="animate-dropIn absolute top-[calc(100%+6px)] right-0 min-w-[200px] bg-[#111] border border-[#222] rounded-[10px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="px-3.5 py-3 border-b border-[#1e1e1e]">
                  <div className="text-[13px] font-medium text-[#ededed]">
                    {user?.fullname}
                  </div>
                  <div className="text-[11px] text-[#555] mt-0.5">
                    {user?.email}
                  </div>
                </div>
                <Link to="/my-project">               
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#aaa] cursor-pointer hover:bg-[#1a1a1a] hover:text-[#ededed] transition-colors duration-100">
                  <span>📁</span> Projects
                </div>
                </Link>
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400 cursor-pointer border-t border-[#1e1e1e] hover:bg-red-400/[0.08] transition-colors duration-100"
                  onClick={handleLogout}
                >
                  <span>↩</span> Log out
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Main ── */}
        <main className="max-w-[1200px] mx-auto px-6 pt-12 pb-16">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-[32px] font-semibold tracking-[-0.8px] text-[#ededed] leading-[1.15]">
              Let's build something new.
            </h1>
            <p className="text-sm text-[#555] mt-1.5">
              Deploy a new project or import an existing repository.
            </p>
          </div>

          {/* Prompt Bar */}
          <div className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-[10px] px-4 py-3 mb-5 transition-colors duration-200 focus-within:border-[#444]">
            <svg
              className="text-[#444] flex-shrink-0"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
            >
              <path
                d="M7.5 1L14 7.5L7.5 14M1 7.5h13"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <input
              className="flex-1 bg-transparent border-none outline-none text-[#ededed] text-sm placeholder-[#444]"
              style={{ fontFamily: "inherit" }}
              placeholder="Ask to build or enter a Git repository URL…"
            />
          </div>

          {/* Shortcut Pills */}
          <div className="flex gap-2 flex-wrap mb-12">
            {[
              { icon: "✉", label: "Contact Form" },
              { icon: "🖼", label: "Image Editor" },
              { icon: "🎮", label: "Mini Game" },
              { icon: "📊", label: "Finance Calculator" },
            ].map((p) => (
              <button
                key={p.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1e1e1e] bg-[#111] text-xs text-[#888] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc] hover:bg-[#161616]"
              >
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT – Repos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-semibold text-[#ededed] tracking-tight">
                  Import Git Repository
                </span>
                {filteredRepos.length > 0 && (
                  <span className="text-[11px] text-[#444]">
                    {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, filteredRepos.length)} of{" "}
                    {filteredRepos.length}
                  </span>
                )}
              </div>

              {/* GitHub account selector + Search bar */}
              <div className="flex gap-2 mb-3">
                {/* Account selector */}
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#222] bg-[#111] min-w-0 flex-shrink-0"
                  style={{ minWidth: 0, width: "48%" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-[#888] flex-shrink-0"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span className="text-[13px] text-[#ccc] truncate flex-1">
                    {user?.username ?? user?.fullname ?? "Loading…"}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-[#555] flex-shrink-0"
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Search box */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#222] bg-[#111] flex-1 transition-colors duration-150 focus-within:border-[#333]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#555] flex-shrink-0"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16.5 16.5L21 21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#ccc] placeholder-[#444]"
                    style={{ fontFamily: "inherit" }}
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              </div>

              {/* Repo rows */}
              <div className="flex flex-col gap-0.5">
                {repos.length === 0 ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3.5 py-3"
                    >
                      <div className="animate-shimmer w-8 h-8 rounded-lg flex-shrink-0" />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div
                          className="animate-shimmer h-3 rounded"
                          style={{ width: "55%" }}
                        />
                        <div
                          className="animate-shimmer h-2.5 rounded"
                          style={{ width: "30%" }}
                        />
                      </div>
                    </div>
                  ))
                ) : visibleRepos.length === 0 ? (
                  <div className="px-3.5 py-8 text-center text-[13px] text-[#444]">
                    No repositories match "
                    <span className="text-[#666]">{search}</span>"
                  </div>
                ) : (
                  visibleRepos.map((repo: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-transparent cursor-pointer transition-all duration-150 hover:bg-[#111] hover:border-[#1e1e1e]"
                      onClick={() => handleImport(repo)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-medium text-[#ccc] truncate">
                            {repo.name}
                          </span>
                          {repo.private && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-[#555] flex-shrink-0"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M7 11V7a5 5 0 0 1 10 0v4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                          {repo.created_at && (
                            <span className="text-[13px] text-[#555]">
                              · {formatDate(repo.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="px-3 py-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] text-[#ccc] text-xs font-medium cursor-pointer flex-shrink-0 transition-all duration-150 hover:bg-[#222] hover:border-[#3a3a3a] hover:text-[#ededed]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImport(repo);
                        }}
                      >
                        Import
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1a1a1a]">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-xs text-[#666] cursor-pointer transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>

                  {/* Page dots */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: filteredPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPage(idx)}
                        className={`h-1.5 rounded-full transition-all duration-150 cursor-pointer border-0 p-0 ${
                          idx === page
                            ? "bg-[#888] w-4"
                            : "bg-[#333] w-1.5 hover:bg-[#555]"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    disabled={page === filteredPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-xs text-[#666] cursor-pointer transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT – Cloud Animation Panel */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-semibold text-[#ededed] tracking-tight">
                  Live Environment
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#3a3a3a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  All systems operational
                </span>
              </div>

              {/* Canvas panel */}
              <div
                className="relative rounded-xl overflow-hidden border border-[#1e1e1e] bg-[#07080f]"
                style={{ height: 320 }}
              >
                <CloudCanvas />

                {/* Floating label overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <div className="text-[11px] tracking-[0.2em] uppercase text-[#ffffff18] font-medium mb-2">
                    Powered by
                  </div>
                  <div
                    className="text-[28px] font-semibold tracking-tight"
                    style={{
                      background:
                        "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    DeployKit Cloud
                  </div>
                  <div className="text-[12px] text-[#ffffff22] mt-1.5">
                    Edge network · 99.98% uptime · Global CDN
                  </div>
                </div>

                {/* Bottom stats bar */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-4 py-3 border-t border-[#ffffff08] bg-[rgba(7,8,15,0.7)] backdrop-blur-sm">
                  {[
                    { label: "Regions", value: "32" },
                    { label: "Latency", value: "12ms" },
                    { label: "Uptime", value: "99.98%" },
                    { label: "Deploys", value: "∞" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <span className="text-[13px] font-semibold text-[#d0d0d0]">
                        {value}
                      </span>
                      <span className="text-[10px] text-[#444] uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
