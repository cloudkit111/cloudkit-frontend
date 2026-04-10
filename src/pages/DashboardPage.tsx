/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import logo from "../assets/cloudkit.png";
import api from "../config/api-client";
import { toast } from "sonner";
import Navbar from "@/components/navbar/Navbar";
import Search from "@/assets/svg/Search";
import Private from "@/assets/svg/Private";

// ── Cloud / floating orbs canvas animation ────────────────────────────────

function CloudCanvas() {
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
      const ctx = canvas.getContext("2d")!;
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

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);

      const bgG = ctx.createLinearGradient(0, 0, W, H);
      bgG.addColorStop(0, "#07080f");
      bgG.addColorStop(0.5, "#090b16");
      bgG.addColorStop(1, "#06080c");
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
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const isSavingInstall = useRef(false);

  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await api.get(`${import.meta.env.VITE_BACKEND_URI}/auth/me`, {
        withCredentials: true,
      });
      console.log(res);
      setUser(res.data);
      if (res.status === 200)
        toast(`Loaded ${res?.data?.repos?.length} public repositories`);
      setRepos(res.data.repos || []);
      return res.data;
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get(`${import.meta.env.VITE_BACKEND_URI}/auth/logout`, {
        withCredentials: true,
      });
      window.location.href = "/";
    } catch (err) {
      console.log(err);
    }
  };

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

  // FIX: single useEffect handles everything in correct order
  useEffect(() => {
    const init = async () => {
      // Step 1: fetch user first — confirms cookie is valid
      const userData = await fetchUser();

      if (!userData) return; // not logged in

      // Step 2: check for installation_id in URL
      const params = new URLSearchParams(window.location.search);
      const installationId = params.get("installation_id");

      if (installationId) {
        isSavingInstall.current = true; // 🔒 block redirect while saving
        const toastId = toast.loading("Saving installation...");

        try {
          await api.post(
            `${import.meta.env.VITE_BACKEND_URI}/api/save-installation`,
            { installationId },
            { withCredentials: true }
          );

          toast.dismiss(toastId);
          toast.success("GitHub App installed successfully!");

          await fetchUser();
          window.history.replaceState({}, "", window.location.pathname);
        } catch (err) {
          console.error("Failed to save installation:", err);
          toast.dismiss(toastId);
          toast.error("Failed to save installation. Please try again.");
        } finally {
          isSavingInstall.current = false;
        }
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (user && !user.installationId) {
      // Don't redirect if a save is actively in progress
      if (isSavingInstall.current) return;

      // Don't redirect if installation_id is still in the URL
      const params = new URLSearchParams(window.location.search);
      if (params.get("installation_id")) return;

      toast.info("Please install the CloudKit GitHub App to continue");
      setTimeout(() => {
        window.location.href =
          "https://github.com/apps/cloudkit11/installations/new";
      }, 2000);
    }
  }, [user]);

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

      <div className="bg-[#0a0a0a] text-white min-h-screen flex flex-col">
        <Navbar variant="auth" user={user} onLogout={handleLogout} scrolled />

        {/* ── Main ── */}
        <main className="flex-1 flex items-center justify-center px-20">
          <div className="w-full max-w-4xl">
            <div className="mb-12">
              <h1 className="md:text-5xl mt-20 font-semibold tracking-[-0.8px] text-white leading-[1.15]">
                Let's build something new.
              </h1>
              <p className="text-3xl text-white mt-1.5">
                Deploy a new project or import an existing repository.
              </p>
            </div>

            <div className="">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-semibold text-white tracking-tight">
                    Import Git Repository
                  </span>
                  {filteredRepos.length > 0 && (
                    <span className="text-base text-white">
                      {page * PAGE_SIZE + 1}–
                      {Math.min((page + 1) * PAGE_SIZE, filteredRepos.length)} of{" "}
                      {filteredRepos.length}
                    </span>
                  )}
                </div>

                {/* GitHub account selector + Search bar */}
                <div className="flex gap-2 mb-3">
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#222] bg-[#111] min-w-0 flex-shrink-0"
                    style={{ minWidth: 0, width: "48%" }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-white flex-shrink-0"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span className="text-base text-white truncate flex-1">
                      {user?.username ?? user?.fullname ?? "Loading…"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#222] bg-[#111] flex-1 transition-colors duration-150 focus-within:border-[#333]">
                    <Search />
                    <input
                      className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder-[#444]"
                      style={{ fontFamily: "inherit" }}
                      placeholder="Search.."
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
                    <div className="px-3.5 py-8 text-center text-base text-white">
                      No repositories match "
                      <span className="text-white">{search}</span>"
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
                            <span className="text-base font-medium text-white truncate">
                              {repo.name}
                            </span>
                            {repo.private && (<Private />)}
                            {repo.created_at && (
                              <span className="text-[13px] text-white">
                                · {formatDate(repo.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="px-3 py-1 rounded-md border border-[#2a2a2a] bg-white text-black text-base font-medium cursor-pointer flex-shrink-0 transition-all duration-150"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-base text-white cursor-pointer transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: filteredPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPage(idx)}
                          className={`h-1.5 rounded-full transition-all duration-150 cursor-pointer border-0 p-0 ${idx === page
                            ? "bg-[#888] w-4"
                            : "bg-[#333] w-1.5 hover:bg-[#555]"
                            }`}
                        />
                      ))}
                    </div>

                    <button
                      disabled={page === filteredPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-base text-white cursor-pointer transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}