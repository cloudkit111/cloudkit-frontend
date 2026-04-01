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
type SubdomainMode = "auto" | "custom";

interface EnvVar {
  key: string;
  value: string;
  id: string;
}

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

  // ── Subdomain toggle state ──
  const [subdomainMode, setSubdomainMode] = useState<SubdomainMode>("auto");
  const [customSlug, setCustomSlug] = useState("");
  const [customSlugError, setCustomSlugError] = useState("");

  // ── Environment Variables ──
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showEnvSection, setShowEnvSection] = useState(false);
  const [showEnvToast, setShowEnvToast] = useState(false);

  // ── init phase & init log lines ──
  const [initLogs, setInitLogs] = useState<string[]>([]);
  const [isInitPhase, setIsInitPhase] = useState(false);
  const initTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const deployUrlRef = useRef("");
  const slugRef = useRef("");

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

  // ── Socket listener ──
  useEffect(() => {
    const handleMessage = (data: string) => {
      setIsInitPhase(false);
      initTimersRef.current.forEach(clearTimeout);
      initTimersRef.current = [];

      let log = data;
      try {
        const parsed = JSON.parse(data);
        log = parsed.log ?? data;
      } catch {
        log = data;
      }

      setLogs((prev) => [...prev, log]);

      if (/(^|\s)(error|fail|failed)(\s|$)/i.test(log)) {
        setStatus("error");
      } else if (/(^|\s)(success|done|completed|built|complete)(\s|$)/i.test(log)) {
        setStatus("success");
      }
    };

    socket.on("message", handleMessage);
    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  // ── Slug input handler with strict validation ──
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setCustomSlug(sanitized);

    if (sanitized && sanitized.length < 3) {
      setCustomSlugError("Minimum 3 characters required");
    } else if (sanitized.startsWith("-") || sanitized.endsWith("-")) {
      setCustomSlugError("Cannot start or end with a hyphen");
    } else if (sanitized.includes("--")) {
      setCustomSlugError("Cannot contain consecutive hyphens");
    } else {
      setCustomSlugError("");
    }
  };

  // ── Environment Variable Handlers ──
  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "", id: Date.now().toString() }]);
  };

  const updateEnvVar = (id: string, field: "key" | "value", val: string) => {
    setEnvVars(
      envVars.map((env) => (env.id === id ? { ...env, [field]: val } : env))
    );
  };

  const removeEnvVar = (id: string) => {
    setEnvVars(envVars.filter((env) => env.id !== id));
  };

  const saveEnvVars = () => {
    const validEnvs = envVars.filter((env) => env.key.trim() && env.value.trim());
    if (validEnvs.length === 0) {
      return;
    }
    
    // Show toast
    setShowEnvToast(true);
    setTimeout(() => setShowEnvToast(false), 3000);
  };

  const handleDeploy = async () => {
    if (deployLock.current) return;

    if (subdomainMode === "custom") {
      if (!customSlug || customSlug.trim().length < 3) {
        setCustomSlugError("Please enter a valid subdomain (min 3 characters)");
        return;
      }
      if (customSlug.startsWith("-") || customSlug.endsWith("-")) {
        setCustomSlugError("Cannot start or end with a hyphen");
        return;
      }
      if (customSlug.includes("--")) {
        setCustomSlugError("Cannot contain consecutive hyphens");
        return;
      }
    }

    deployLock.current = true;
    setHasDeployed(true);
    setStatus("deploying");
    setLogs([]);
    setInitLogs([]);

    // Start init phase
    setIsInitPhase(true);
    INIT_MESSAGES.forEach((msg, i) => {
      const t = setTimeout(() => {
        setInitLogs((prev) => [...prev, msg]);
      }, i * 1200);
      initTimersRef.current.push(t);
    });

    try {
      // Convert env vars to object format
      const envsObject: Record<string, string> = {};
      envVars.forEach((env) => {
        if (env.key.trim() && env.value.trim()) {
          envsObject[env.key.trim()] = env.value.trim();
        }
      });

      const res = await api.post(
        `${import.meta.env.VITE_BACKEND_URI}/project`,
        {
          gitURL: githubRepoURL,
          repoName,
          ...(subdomainMode === "custom" && customSlug
            ? { userSlug: customSlug }
            : {}),
          ...(Object.keys(envsObject).length > 0 ? { envs: envsObject } : {}),
        },
      );

      const url =
        res?.data?.data?.url ??
        res?.data?.data?.deployUrl ??
        res?.data?.url ??
        "";
      const slug = res?.data?.data?.projectSlug ?? "";

      if (url) {
        setDeployUrl(url);
        deployUrlRef.current = url;
      }
      slugRef.current = slug;

      // Subscribe to logs channel
      const channel = `logs:${slug}`;
      const subscribe = () => socket.emit("subscribe", channel);

      if (socket.connected) {
        subscribe();
      } else {
        socket.once("connect", subscribe);
      }

    } catch (err: any) {
      setIsInitPhase(false);
      initTimersRef.current.forEach(clearTimeout);

      if (err?.response?.status === 409) {
        setCustomSlugError("This subdomain is already taken. Try another.");
        setSubdomainMode("custom");
        deployLock.current = false;
        setHasDeployed(false);
        setStatus("idle");
        return;
      }

      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.msg ??
        err?.message ??
        "Failed to start deployment.";
      setLogs((prev) => [...prev, `Error: ${msg}`]);
      setStatus("error");
    }
  };

  // Cleanup init timers on unmount
  useEffect(() => {
    return () => {
      initTimersRef.current.forEach(clearTimeout);
    };
  }, []);

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
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .toast-enter { animation: slideIn 0.3s ease forwards; }
        .toast-exit { animation: slideOut 0.3s ease forwards; }
      `}</style>

      <ConfettiCanvas active={showConfetti} />

      {/* Toast notification for env saved */}
      {showEnvToast && (
        <div className="fixed top-20 right-6 z-[100] toast-enter">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-md shadow-lg">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[13px] text-emerald-400 font-medium">Environment variables saved</span>
          </div>
        </div>
      )}

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
            {/* Left – repo info + subdomain */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                {/* Repository */}
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

                {/* ── Subdomain section ── */}
                <div className="mt-5 pt-4 border-t border-[#1a1a1a]">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-[#444] mb-3">
                    Subdomain
                  </div>

                  {/* Toggle pill */}
                  <div className="flex gap-1 bg-[#0d0d0d] rounded-lg p-1 w-fit mb-3">
                    {(["auto", "custom"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          if (hasDeployed) return;
                          setSubdomainMode(m);
                          setCustomSlugError("");
                        }}
                        disabled={hasDeployed}
                        className="px-3.5 py-1 rounded-md text-[12px] font-medium transition-all duration-150 capitalize"
                        style={{
                          background:
                            subdomainMode === m ? "#ededed" : "transparent",
                          color: subdomainMode === m ? "#0a0a0a" : "#555",
                          cursor: hasDeployed ? "not-allowed" : "pointer",
                          border: "none",
                          outline: "none",
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {subdomainMode === "auto" ? (
                    <div className="flex items-center bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg overflow-hidden">
                      <span className="text-[13px] font-mono text-[#555] px-3 py-2 italic">
                        auto-generated
                      </span>
                      <span className="text-[13px] text-[#3a3a3a] py-2 pr-3">
                        .cloud-kit.app
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div
                        className="flex items-center rounded-lg overflow-hidden transition-all duration-150"
                        style={{
                          border: customSlugError
                            ? "1px solid #e24b4a"
                            : "1px solid #333",
                          background: "#0d0d0d",
                        }}
                      >
                        <input
                          type="text"
                          value={customSlug}
                          onChange={handleSlugChange}
                          disabled={hasDeployed}
                          placeholder="my-awesome-project"
                          autoFocus
                          className="flex-1 bg-transparent text-[13px] font-mono text-[#ededed] outline-none px-3 py-2 placeholder:text-[#2e2e2e]"
                          style={{ cursor: hasDeployed ? "not-allowed" : "text" }}
                        />
                        <span className="text-[13px] text-[#555] py-2 pr-3 pl-0 whitespace-nowrap flex-shrink-0">
                          .cloud-kit.app
                        </span>
                      </div>

                      {customSlugError ? (
                        <span className="text-[11px] text-[#e24b4a] pl-1 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          {customSlugError}
                        </span>
                      ) : customSlug ? (
                        <span className="text-[11px] text-emerald-600 pl-1 flex items-center gap-1 font-mono">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          {customSlug}.cloud-kit.app
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#444] pl-1">
                          Only lowercase letters, numbers, and hyphens allowed.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Environment Variables Section ── */}
                <div className="mt-5 pt-4 border-t border-[#1a1a1a]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] uppercase tracking-[0.15em] text-[#444]">
                      Environment Variables
                    </div>
                    <button
                      onClick={() => setShowEnvSection(!showEnvSection)}
                      disabled={hasDeployed}
                      className="text-[11px] text-[#666] hover:text-[#999] transition-colors duration-150 flex items-center gap-1"
                      style={{ cursor: hasDeployed ? "not-allowed" : "pointer" }}
                    >
                      {showEnvSection ? "Hide" : "Show"}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: showEnvSection ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {showEnvSection && (
                    <div className="space-y-2">
                      {envVars.map((env) => (
                        <div key={env.id} className="flex gap-2">
                          <input
                            type="text"
                            value={env.key}
                            onChange={(e) =>
                              updateEnvVar(env.id, "key", e.target.value)
                            }
                            disabled={hasDeployed}
                            placeholder="KEY"
                            className="flex-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[12px] font-mono text-[#ededed] outline-none focus:border-[#333] transition-colors placeholder:text-[#2e2e2e]"
                            style={{ cursor: hasDeployed ? "not-allowed" : "text" }}
                          />
                          <input
                            type="text"
                            value={env.value}
                            onChange={(e) =>
                              updateEnvVar(env.id, "value", e.target.value)
                            }
                            disabled={hasDeployed}
                            placeholder="value"
                            className="flex-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[12px] font-mono text-[#ededed] outline-none focus:border-[#333] transition-colors placeholder:text-[#2e2e2e]"
                            style={{ cursor: hasDeployed ? "not-allowed" : "text" }}
                          />
                          <button
                            onClick={() => removeEnvVar(env.id)}
                            disabled={hasDeployed}
                            className="w-8 h-8 rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] text-[#666] hover:text-[#e24b4a] hover:border-[#e24b4a]/30 transition-all duration-150 flex items-center justify-center"
                            style={{ cursor: hasDeployed ? "not-allowed" : "pointer" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={addEnvVar}
                        disabled={hasDeployed}
                        className="w-full py-2 rounded-lg border border-dashed border-[#1e1e1e] bg-[#0d0d0d] text-[12px] text-[#666] hover:text-[#999] hover:border-[#333] transition-all duration-150 flex items-center justify-center gap-1.5"
                        style={{ cursor: hasDeployed ? "not-allowed" : "pointer" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Variable
                      </button>

                      {envVars.length > 0 && (
                        <div className="flex items-center justify-between pt-2">
                          <div className="text-[10px] text-[#444] pl-1">
                            {envVars.filter((e) => e.key.trim() && e.value.trim()).length} variable(s) ready
                          </div>
                          <button
                            onClick={saveEnvVars}
                            disabled={hasDeployed || envVars.filter((e) => e.key.trim() && e.value.trim()).length === 0}
                            className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#222] text-[11px] text-[#999] hover:border-[#333] hover:text-[#ccc] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Deploy URL card — only visible after SUCCESS */}
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
                  <div className="relative w-full flex flex-col flex-1">
                    <PreviewFrame url={deployUrl} />
                  </div>
                ) : (
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
              {!hasDeployed ? (
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
                <div className="flex flex-col gap-0.5">
                  {logs.map((line, i) => (
                    <LogLine key={i} line={line} />
                  ))}
                  <div ref={logsEndRef} />
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {initLogs.map((line, i) => (
                    <LogLine key={i} line={line} isInit />
                  ))}
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