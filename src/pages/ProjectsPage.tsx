import React, { useEffect, useState, useRef } from "react";
import logo from "./assets/cloudkit.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────
type Project = {
    _id: string;
    project_url: string;
    slug: string;
    repoName: string;
};

// ── Scaled iframe preview (same as DeployPage) ────────────────────────────
function PreviewFrame({ url }: { url: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.27);
    const RENDER_W = 1280;
    const RENDER_H = 800;

    useEffect(() => {
        const update = () => {
            if (!containerRef.current) return;
            setScale(containerRef.current.offsetWidth / RENDER_W);
        };
        update();
        const ro = new ResizeObserver(update);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{ height: Math.ceil(RENDER_H * scale) }}
        >
            <iframe
                src={url}
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{
                    border: "none",
                    width: `${RENDER_W}px`,
                    height: `${RENDER_H}px`,
                    display: "block",
                    transformOrigin: "top left",
                    transform: `scale(${scale})`,
                    pointerEvents: "none",
                }}
            />
            <div
                className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                style={{
                    background:
                        "linear-gradient(to bottom, transparent, rgba(10,10,10,0.85))",
                }}
            />
        </div>
    );
}

// ── Project Card ──────────────────────────────────────────────────────────
function ProjectCard({
    project,
    onClick,
}: {
    project: Project;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className="group bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#333] hover:bg-[#141414]"
            style={{ boxShadow: "0 0 0 0 transparent" }}
            onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
            {/* Preview thumbnail */}
            <div className="relative w-full bg-[#0a0a0a] border-b border-[#1e1e1e] overflow-hidden">
                <PreviewFrame url={project.project_url} />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[rgba(0,0,0,0)] group-hover:bg-[rgba(0,0,0,0.18)] transition-all duration-200 pointer-events-none" />
            </div>

            {/* Card footer */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-[13px] font-medium text-[#ededed] truncate">
                            {project.repoName ?? project.slug}
                        </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#555] truncate block">
                        {project.project_url}
                    </span>
                </div>

                {/* External link — opens in browser tab */}
                <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 w-7 h-7 rounded-lg border border-[#222] bg-[#1a1a1a] flex items-center justify-center text-[#555] transition-all duration-150 hover:border-[#444] hover:text-[#ccc] hover:bg-[#222]"
                    title="Open in new tab"
                >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </a>
            </div>
        </div>
    );
}

// ── Project Detail Modal ──────────────────────────────────────────────────
function ProjectModal({
    project,
    onClose,
}: {
    project: Project;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(project.project_url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{
                zIndex: 9998,
                backgroundColor: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
            }}
            onClick={handleBackdrop}
        >
            <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-slide { animation: modalSlideUp 0.25s ease forwards; }
      `}</style>

            <div className="modal-slide bg-[#0f0f0f] border border-[#222] rounded-2xl w-full max-w-[680px] mx-4 overflow-hidden">
                {/* Top accent line */}
                <div
                    className="h-[2px] w-full"
                    style={{
                        background:
                            "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #34d399)",
                    }}
                />

                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-[#777]"
                            >
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[14px] font-semibold text-[#ededed]">
                                {project.repoName ?? project.slug}
                            </div>
                            <div className="text-[11px] text-[#555] font-mono">
                                {project.slug}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg border border-[#222] bg-[#1a1a1a] flex items-center justify-center text-[#555] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc]"
                    >
                        ✕
                    </button>
                </div>

                {/* Live preview */}
                <div className="border-b border-[#1a1a1a]">
                    {/* Fake browser bar */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border-b border-[#1a1a1a]">
                        <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                            <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                            <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                        </div>
                        <div className="flex-1 bg-[#1a1a1a] border border-[#222] rounded-md px-2.5 py-1 flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="text-[10px] font-mono text-[#555] truncate">
                                {project.project_url}
                            </span>
                        </div>
                    </div>
                    <PreviewFrame url={project.project_url} />
                </div>

                {/* URL + actions */}
                <div className="px-5 py-4 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                    <span className="flex-1 text-[12px] font-mono text-[#60a5fa] truncate">
                        {project.project_url}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-[#222] bg-[#1a1a1a] text-[#666] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc] flex-shrink-0"
                    >
                        {copied ? "✓ Copied" : "Copy"}
                    </button>
                    <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] px-3 py-1 rounded-lg text-white font-medium flex-shrink-0 no-underline transition-all duration-150"
                        style={{
                            background:
                                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
                        }}
                    >
                        Visit Site →
                    </a>
                </div>
            </div>
        </div>
    );
}

// ── Main Projects Page ────────────────────────────────────────────────────
function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Project | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URI}/api/projects`,
                    { withCredentials: true },
                );
                // flatten: res.data.projects is array of projects
                console.log(res.data)
                setProjects(res.data.projects ?? []);
                console.log(projects);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    return (
        <>
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fadeUp { animation: fadeUp 0.35s ease forwards; }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

            {selected && (
                <ProjectModal project={selected} onClose={() => setSelected(null)} />
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
                            cloudkit
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
                <main className="max-w-[1100px] mx-auto px-6 pt-12 pb-16 anim-fadeUp">
                    {/* Heading */}
                    <div className="mb-10">
                        <h1 className="text-[28px] font-semibold tracking-[-0.7px] text-[#ededed] leading-tight">
                            Your Projects
                        </h1>
                        <p className="text-sm text-[#555] mt-1.5">
                            All your deployed projects. Click a project to preview, or use the
                            link icon to open it.
                        </p>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        // Skeleton
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden"
                                >
                                    <div className="animate-shimmer w-full h-[160px]" />
                                    <div className="px-4 py-3 flex flex-col gap-2">
                                        <div
                                            className="animate-shimmer h-3 rounded"
                                            style={{ width: "55%" }}
                                        />
                                        <div
                                            className="animate-shimmer h-2.5 rounded"
                                            style={{ width: "75%" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        // Empty state
                        <div className="flex flex-col items-center justify-center py-24 gap-4 select-none">
                            <div className="w-14 h-14 rounded-xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[24px]">
                                🚀
                            </div>
                            <div className="text-center">
                                <div className="text-[15px] font-medium text-[#444]">
                                    No deployments yet
                                </div>
                                <div className="text-[13px] text-[#333] mt-1">
                                    Deploy your first project from the dashboard
                                </div>
                            </div>
                            <button
                                onClick={() => navigate("/")}
                                className="mt-2 px-4 py-2 rounded-lg border border-[#222] bg-[#111] text-[13px] text-[#666] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc]"
                            >
                                Go to Dashboard →
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project._id}
                                    project={project}
                                    onClick={() => setSelected(project)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

export default ProjectsPage;