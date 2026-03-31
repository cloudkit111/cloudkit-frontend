/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import logo from "../assets/cloudkit.png";
import api from "@/config/api-client";
import ConfettiCanvas from "@/components/canvas/ConfettiCanvas";
import DeployCanvas from "@/components/canvas/DeployCanvas";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LogLine } from "@/components/ui/LogLine";
import SuccessModal from "@/components/ui/SucessModal";
import PreviewFrame from "@/components/preview/PreviewFrame";

// ── Init log messages shown before real logs arrive ───────────────────────
const INIT_MESSAGES = [
  "Initializing project environment…",
  "Fetching repository metadata…",
  "Resolving dependencies…",
  "Provisioning build container…",
  "Setting up file system…",
  "Preparing build pipeline…",
];

type Status = "idle" | "deploying" | "success" | "error";


// ── Main Deploy Page ──────────────────────────────────────────────────────
export default function DeployPage() {
  const githubRepoURL = sessionStorage.getItem("deployment_url") ?? "";
  const repoName =
    githubRepoURL.split("/").pop()?.replace(".git", "") ?? "project";
  const deployLock = useRef(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [hasDeployed, setHasDeployed] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ── FIX 2: track init phase & init log lines separately ──
  const [initLogs, setInitLogs] = useState<string[]>([]);
  const [isInitPhase, setIsInitPhase] = useState(false);
  const initTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const deployUrlRef = useRef("");
  const slugRef = useRef("");

  // ── FIX: guard so project is stored only once ──
  const hasStoredRef = useRef(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, initLogs]);

  // Trigger confetti + modal on success
  useEffect(() => {
    if (status === "success") {
      setShowConfetti(true);
      setShowModal(true);
      setTimeout(() => setShowConfetti(false), 4200);
    }
  }, [status]);

  // Socket listener — preserved exactly as original
  useEffect(() => {
    const handleMessage = (log: string) => {
      // ── FIX 2: first real log → end init phase, clear init timers ──
      setIsInitPhase(false);
      initTimersRef.current.forEach(clearTimeout);
      initTimersRef.current = [];

      setLogs((prev) => [...prev, log]);
      if (/(^|\s)(error|fail|failed)(\s|$)/i.test(log)) setStatus("error");
      else if (/(^|\s)(success|done|completed|built)(\s|$)/i.test(log)) {
        setStatus("success");
        // ── FIX: only store once using hasStoredRef guard ──
        if (!hasStoredRef.current && deployUrlRef.current && slugRef.current) {
          hasStoredRef.current = true;
          api
            .post(
              `${import.meta.env.VITE_BACKEND_URI}/api/add`,
              {
                project_url: deployUrlRef.current,
                slug: slugRef.current,
                repoName,
              },
              { withCredentials: true },
            )
            .catch((e) => console.log("StoreProject error:", e));
        }
      }
    };

    socket.on("message", handleMessage);
    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  const handleDeploy = async () => {
    if (deployLock.current) return;
    deployLock.current = true;
    setHasDeployed(true);
    setStatus("deploying");
    setLogs([]);
    setInitLogs([]);

    // ── FIX 2: start init phase — drip messages every ~1.2s ──
    setIsInitPhase(true);
    INIT_MESSAGES.forEach((msg, i) => {
      const t = setTimeout(() => {
        setInitLogs((prev) => [...prev, msg]);
      }, i * 1200);
      initTimersRef.current.push(t);
    });

    try {
      const res = await api.post(
        `${import.meta.env.VITE_BACKEND_URI}/project`,
        { gitURL: githubRepoURL },
      );

      // ── FIX 1: store URL but DON'T show it yet — shown only on success ──
      const url =
        res?.data?.data?.url ??
        res?.data?.data?.deployUrl ??
        res?.data?.url ??
        "";
      if (url) {
        setDeployUrl(url);
        deployUrlRef.current = url;
      }

      const slug = res?.data?.data?.projectSlug ?? "";
      slugRef.current = slug;
      const channel = `logs:${slug}`;
      if (socket.connected) {
        socket.emit("subscribe", channel);
      } else {
        socket.once("connect", () => {
          socket.emit("subscribe", channel);
        });
      }
    } catch (err) {
      setIsInitPhase(false);
      initTimersRef.current.forEach(clearTimeout);
      setLogs((prev) => [...prev, "Error: Failed to start deployment."]);
      setStatus("error");
    }
  };

  // Cleanup init timers on unmount
  useEffect(() => {
    return () => {
      initTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Combined log lines for rendering
  const allInitLogs = initLogs;
  const realLogsStarted = logs.length > 0;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fadeUp { animation: fadeUp 0.35s ease forwards; }
        .log-scroll::-webkit-scrollbar { width: 4px; }
        .log-scroll::-webkit-scrollbar-track { background: transparent; }
        .log-scroll::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
        .log-scroll::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>

      <ConfettiCanvas active={showConfetti} />

      {showModal && (
        <SuccessModal
          repoName={repoName}
          deployUrl={deployUrl}
          onClose={() => setShowModal(false)}
        />
      )}

      <div
        className="min-h-screen bg-[#0a0a0a] text-[#ededed]"
        style={{
          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
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
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-xs text-[#666] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc]"
          >
            ← Dashboard
          </button>
        </header>

        {/* ── Main ── */}
        <main className="max-w-[900px] mx-auto px-6 pt-12 pb-16 anim-fadeUp">
          {/* Page heading */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-[#555] text-xs mb-3 tracking-wide uppercase">
              <span>New Deployment</span>
              <span>·</span>
              <span className="text-[#888] font-mono">{repoName}</span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-[-0.7px] text-[#ededed] leading-tight">
              Deploy Project
            </h1>
            <p className="text-sm text-[#555] mt-1.5">
              Hit Deploy to build and ship your project to the edge.
            </p>
          </div>

          {/* Repo card + canvas panel */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">
            {/* Left – repo info only */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[#444] mb-3">
                  Repository
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#222] flex items-center justify-center flex-shrink-0">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-[#777]"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#ededed] truncate">
                      {repoName}
                    </div>
                    <div className="text-[11px] text-[#555] truncate mt-0.5 font-mono">
                      {githubRepoURL}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── FIX 1: Deploy URL card — only visible after deploy SUCCESS ── */}
              {status === "success" && deployUrl && (
                <div className="bg-[#111] border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-[13px] font-mono text-[#60a5fa] truncate hover:text-[#93c5fd] transition-colors duration-150"
                  >
                    {deployUrl}
                  </a>
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-[#222] bg-[#1a1a1a] text-[#666] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc] no-underline"
                  >
                    Visit →
                  </a>
                </div>
              )}
            </div>

            {/* Right – animated canvas + deploy button */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div
                className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden flex flex-col"
                style={{ minHeight: 180 }}
              >
                {status === "success" && deployUrl ? (
                  /* ── Live preview iframe (like Vercel) ── */
                  <div className="relative w-full flex flex-col flex-1">
                    <PreviewFrame url={deployUrl} />
                  </div>
                ) : (
                  /* ── Animated canvas while idle / deploying / error ── */
                  <div
                    className="relative w-full h-full"
                    style={{ minHeight: 180 }}
                  >
                    <DeployCanvas />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-1">
                      <StatusBadge status={status} />
                      <div className="text-[11px] text-[#333] mt-1">
                        {status === "idle" && "Awaiting deployment"}
                        {status === "deploying" && "Building your project…"}
                        {status === "error" && "Something went wrong"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Deploy button */}
              <button
                onClick={handleDeploy}
                disabled={hasDeployed}
                className="relative w-full py-3.5 rounded-xl text-[14px] font-semibold tracking-tight transition-all duration-200 overflow-hidden"
                style={{
                  background: hasDeployed
                    ? "#1a1a1a"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
                  color: hasDeployed ? "#444" : "#fff",
                  border: hasDeployed ? "1px solid #222" : "none",
                  cursor: hasDeployed ? "not-allowed" : "pointer",
                  boxShadow: hasDeployed
                    ? "none"
                    : "0 0 32px rgba(99,102,241,0.3)",
                }}
              >
                {!hasDeployed && (
                  <span
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #22d3ee 100%)",
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {hasDeployed ? (
                    status === "deploying" ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#555] border-t-[#888] rounded-full animate-spin inline-block" />
                        Deploying…
                      </>
                    ) : status === "success" ? (
                      "✓ Deployed"
                    ) : status === "error" ? (
                      "✗ Failed"
                    ) : (
                      "Deployed"
                    )
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M12 3L20 12H15V21H9V12H4L12 3Z"
                          fill="currentColor"
                        />
                      </svg>
                      Deploy Now
                    </>
                  )}
                </span>
              </button>

              {/* Re-open modal */}
              {status === "success" && !showModal && (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-2 rounded-xl border border-emerald-500/30 text-[12px] text-emerald-400 cursor-pointer transition-all duration-150 hover:bg-emerald-500/10"
                >
                  🎉 View deployment summary
                </button>
              )}
            </div>
          </div>

          {/* ── Logs panel ── */}
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[11px] text-[#444] tracking-wide uppercase ml-1">
                  Build Logs
                </span>
              </div>
              <div className="flex items-center gap-3">
                {(logs.length > 0 || initLogs.length > 0) && (
                  <span className="text-[10px] text-[#333] font-mono">
                    {logs.length + initLogs.length} lines
                  </span>
                )}
                <StatusBadge status={status} />
              </div>
            </div>

            <div
              className="log-scroll overflow-y-auto px-5 py-4 font-mono"
              style={{ height: 320, backgroundColor: "#080808" }}
            >
              {/* ── FIX 2: show init logs during init phase, real logs after ── */}
              {!hasDeployed ? (
                // Not started yet
                <div className="h-full flex flex-col items-center justify-center gap-2 select-none">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#222]"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M7 8h10M7 12h7M7 16h5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-[12px] text-[#333]">
                    Press Deploy Now to start
                  </span>
                </div>
              ) : realLogsStarted ? (
                // Real logs from socket
                <div className="flex flex-col gap-0.5">
                  {logs.map((line, i) => (
                    <LogLine key={i} line={line} />
                  ))}
                  <div ref={logsEndRef} />
                </div>
              ) : (
                // Init phase — show dripping init messages
                <div className="flex flex-col gap-0.5">
                  {allInitLogs.map((line, i) => (
                    <LogLine key={i} line={line} isInit />
                  ))}
                  {/* Blinking cursor to show it's alive */}
                  <div className="flex gap-2 mt-1">
                    <span className="text-[#2a2a2a] text-[11px]">›</span>
                    <span
                      className="text-[12.5px] font-mono text-[#2a2a2a]"
                      style={{ animation: "blink 1s step-end infinite" }}
                    >
                      ▌
                    </span>
                  </div>
                  <div ref={logsEndRef} />
                  <style>{`
                    @keyframes blink {
                      0%, 100% { opacity: 1; }
                      50% { opacity: 0; }
                    }
                  `}</style>
                </div>
              )}
            </div>

            {logs.length > 0 && (
              <div className="px-5 py-2.5 border-t border-[#111] flex items-center justify-between bg-[#0a0a0a]">
                <span className="text-[10px] text-[#333] font-mono">
                  {status === "deploying" ? "● live stream" : "● ended"}
                </span>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-[#333] hover:text-[#666] transition-colors duration-100 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
