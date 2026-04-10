/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/cloudkit.png";
import axios from "axios";
import CloudKitLogo from "../assets/cloudkit.png"

// ── Types ─────────────────────────────────────────────────────────────────────

type Project = {
    _id: string;
    project_url: string;
    slug: string;
    repoName: string;
    createdAt?: string;
    updatedAt?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeHostname(url?: string): string {
    if (!url) return "";
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function repoInitials(name?: string): string {
    if (!name) return "??";
    const parts = name.replace(/[-_]/g, " ").split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function stringToHue(str?: string): number {
    if (!str) return 220;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    const mo = Math.floor(d / 30);
    return `${mo}mo ago`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ExternalLinkIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function GridIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function ListIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function SearchIcon({ className = "" }: { className?: string }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={className || "text-[#555]"}
        >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function BranchIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
                d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 4-3.6 6-6 6H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ── Monogram avatar ───────────────────────────────────────────────────────────

interface MonogramProps {
    name: string;
    size?: number;
    textSize?: number;
}

function Monogram({ name, size = 32, textSize = 11 }: MonogramProps) {
    const hue = stringToHue(name);
    return (
        <div
            className="rounded-lg flex items-center justify-center font-bold select-none flex-shrink-0"
            style={{
                width: size,
                height: size,
                fontSize: textSize,
                background: `#1a1a1a`,
                color: `#e5e5e5`,
                border: `1px solid #2a2a2a`
            }}
        >
            {repoInitials(name)}
        </div>
    );
}

// ── Project Card — Grid view ──────────────────────────────────────────────────

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
    const name = project?.repoName ?? project?.slug ?? "Untitled";
    const hostname = safeHostname(project?.project_url);
    const ago = timeAgo(project?.updatedAt ?? project?.createdAt);

    return (
        <div
            onClick={onClick}
            className="group bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#333] hover:bg-[#141414]"
            style={{ boxShadow: "none" }}
            onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.45)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
            {/* Domain pill preview area */}
            <div className="relative w-full h-[120px] flex flex-col items-center justify-center gap-3 bg-[#0d0d0d] border-b border-[#1e1e1e]">
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                    }}
                />
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-white">
                        <img src={CloudKitLogo} />
                    </div>
                    {hostname ? (
                        <span className="text-base font-mono text-[#555] truncate max-w-[180px] px-2">
                            {hostname}
                        </span>
                    ) : (
                        <span className="text-base text-[#333]">No URL configured</span>
                    )}
                </div>
            </div>

            {/* Card footer */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Monogram name={name} size={28} textSize={10} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                            <span className="text-base font-medium text-[#ededed] truncate">
                                {name}
                            </span>
                        </div>
                        {ago && (
                            <span className="text-base text-[#555]">{ago}</span>
                        )}
                    </div>
                </div>

                {/* External link */}
                {project?.project_url && (
                    <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 w-7 h-7 rounded-lg border border-[#222] bg-[#1a1a1a] flex items-center justify-center text-[#555] transition-all duration-150 hover:border-[#444] hover:text-[#ccc] hover:bg-[#222]"
                        title="Open in new tab"
                    >
                        <ExternalLinkIcon />
                    </a>
                )}
            </div>
        </div>
    );
}

// ── Project Row — List view ───────────────────────────────────────────────────

function ProjectRow({ project, onClick }: ProjectCardProps) {
    const name = project?.repoName ?? project?.slug ?? "Untitled";
    const hostname = safeHostname(project?.project_url);
    const ago = timeAgo(project?.updatedAt ?? project?.createdAt);

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-[#111] group"
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <Monogram name={name} size={32} textSize={11} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                        <span className="text-base font-medium text-[#ededed] truncate">
                            {name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-base font-mono text-[#555]">
                        {hostname && <span className="truncate">{hostname}</span>}
                        {project?.slug && (
                            <>
                                <span className="text-[#2a2a2a]">·</span>
                                <span className="flex items-center gap-1 text-white">
                                    <BranchIcon />
                                    {project.slug}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Timestamp + actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
                {ago && (
                    <span className="text-base text-white hidden sm:block">{ago}</span>
                )}
                {project?.project_url && (
                    <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-lg border border-[#222] bg-[#1a1a1a] flex items-center justify-center text-[#555] transition-all duration-150 hover:border-[#444] hover:text-[#ccc] hover:bg-[#222] opacity-0 group-hover:opacity-100"
                        title="Open in new tab"
                    >
                        <ExternalLinkIcon />
                    </a>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (project?.project_url) window.open(project.project_url, "_blank");
                    }}
                    className="px-3 py-1 rounded-md border border-[#2a2a2a] bg-white text-black text-base font-medium cursor-pointer transition-all duration-150 hover:bg-[#e5e5e5]"
                >
                    Visit
                </button>
            </div>
        </div>
    );
}

// ── Project Modal ─────────────────────────────────────────────────────────────

interface ProjectModalProps {
    project: Project;
    onClose: () => void;
}

function ProjectModal({ project, onClose }: ProjectModalProps) {
    const [copied, setCopied] = useState(false);
    const name = project?.repoName ?? project?.slug ?? "Untitled";
    const hostname = safeHostname(project?.project_url);
    const ago = timeAgo(project?.updatedAt ?? project?.createdAt);
    const hue = stringToHue(name);

    const handleCopy = () => {
        navigator.clipboard
            .writeText(project?.project_url ?? "")
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => { });
    };

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{
                zIndex: 9998,
                backgroundColor: "rgba(0,0,0,0.78)",
                backdropFilter: "blur(8px)",
            }}
            onClick={handleBackdrop}
        >
            <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-slide { animation: modalSlideUp 0.2s ease forwards; }
      `}</style>

            <div className="modal-slide bg-[#0f0f0f] border border-[#222] rounded-2xl w-full max-w-[560px] mx-4 overflow-hidden">
                {/* Accent bar */}
                <div
                    className="h-[2px] w-full"
                    style={{
                        background: "linear-gradient(90deg, #ffffff, #444444)",
                    }}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <Monogram name={name} size={32} textSize={11} />
                        <div>
                            <div className="text-[14px] font-semibold text-[#ededed]">{name}</div>
                            {project?.slug && (
                                <div className="text-base text-[#555] font-mono">{project.slug}</div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg border border-[#222] bg-[#1a1a1a] flex items-center justify-center text-[#555] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc] text-base"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Details */}
                <div className="px-5 py-5 flex flex-col gap-4">
                    {/* URL row */}
                    {project?.project_url && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#1e1e1e]">
                            <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse" />
                            <span className="flex-1 text-base font-mono text-white truncate">
                                {project.project_url}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="text-base px-2.5 py-1 rounded-lg border border-[#222] bg-[#1a1a1a] text-[#666] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc] flex-shrink-0"
                            >
                                {copied ? "✓ Copied" : "Copy"}
                            </button>
                        </div>
                    )}

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#1e1e1e]">
                            <div className="text-[10px] text-white uppercase tracking-wider mb-1">
                                Domain
                            </div>
                            <div className="text-base font-mono text-white truncate">
                                {hostname || "—"}
                            </div>
                        </div>
                        <div className="px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#1e1e1e]">
                            <div className="text-[10px] text-white uppercase tracking-wider mb-1">
                                Sub domain
                            </div>
                            <div className="text-base font-mono text-white truncate">
                                {project?.slug || "main"}
                            </div>
                        </div>
                        {ago && (
                            <div className="px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#1e1e1e]">
                                <div className="text-[10px] text-white uppercase tracking-wider mb-1">
                                    Last Deployed
                                </div>
                                <div className="text-base text-white">{ago}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="px-5 py-4 border-t border-[#1a1a1a] flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg border border-[#222] bg-[#1a1a1a] text-base text-[#666] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc]"
                    >
                        Close
                    </button>
                    {project?.project_url && (
                        <Link
                            to={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-1.5 rounded-lg text-white text-base font-medium no-underline transition-all duration-150 hover:opacity-90"
                            style={{
                                background: `black`,
                            }}
                        >
                            Visit Site
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden"
                >
                    <div className="animate-shimmer w-full h-[120px]" />
                    <div className="px-4 py-3 flex items-center gap-2.5">
                        <div className="animate-shimmer w-7 h-7 rounded-lg flex-shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                            <div className="animate-shimmer h-3 rounded" style={{ width: "55%" }} />
                            <div className="animate-shimmer h-2.5 rounded" style={{ width: "35%" }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function SkeletonList() {
    return (
        <div className="border border-[#1e1e1e] rounded-xl overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-b-0"
                >
                    <div className="animate-shimmer w-8 h-8 rounded-lg flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="animate-shimmer h-3 rounded" style={{ width: "40%" }} />
                        <div className="animate-shimmer h-2.5 rounded" style={{ width: "28%" }} />
                    </div>
                    <div className="animate-shimmer w-14 h-6 rounded-md" />
                </div>
            ))}
        </div>
    );
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyDeployments({ onNavigate }: { onNavigate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-28 gap-4 select-none">
            <div className="w-14 h-14 rounded-2xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-2xl">
                <img src={CloudKitLogo} />
            </div>
            <div className="text-center">
                <div className="text-[15px] font-medium text-white">No deployments yet</div>
                <div className="text-base text-white mt-1">
                    Deploy your first project from the dashboard
                </div>
            </div>
            <button
                onClick={onNavigate}
                className="mt-2 px-4 py-2 rounded-lg border border-[#222] bg-[#111] text-base text-white cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc]"
            >
                Create your First Project
            </button>
        </div>
    );
}

function EmptySearch({ search, onClear }: { search: string; onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-3 select-none">
            <div className="w-12 h-12 rounded-xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#555]">
                <SearchIcon />
            </div>
            <div className="text-center">
                <div className="text-[14px] font-medium text-[#555]">No results found</div>
                <div className="text-base text-[#333] mt-1">
                    No projects match{" "}
                    <span className="text-[#666]">"{search}"</span>
                </div>
            </div>
            <button
                onClick={onClear}
                className="text-base text-[#555] hover:text-[#ccc] transition-colors"
            >
                Clear search
            </button>
        </div>
    );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

// ── ProjectsPage ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Project | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [fetchError, setFetchError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URI}/api/projects`,
                    { withCredentials: true }
                );
                setProjects(res.data?.projects ?? []);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [search]);

    const filteredProjects = projects.filter((p) => {
        const name = (p?.repoName ?? p?.slug ?? "").toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
    const visibleProjects = filteredProjects.slice(
        page * PAGE_SIZE,
        (page + 1) * PAGE_SIZE
    );

    const handleModalClose = useCallback(() => setSelected(null), []);

    return (
        <>
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .anim-fadeUp { animation: fadeUp 0.3s ease forwards; }
        .animate-shimmer {
          background: linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

            {/* Modal overlay */}
            {selected && (
                <ProjectModal project={selected} onClose={handleModalClose} />
            )}

            <div
                className="min-h-screen bg-[#0a0a0a] text-[#ededed]"
                style={{
                    fontFamily:
                        "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                {/* ── Topbar ── */}
                <header className="h-14 border-b border-[#1f1f1f] flex items-center justify-between px-6 sticky top-0 z-50 bg-[rgba(10,10,10,0.88)] backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center">
                            <img src={logo} alt="cloudkit" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight text-[#ededed]">
                            cloudkit
                        </span>
                        <span className="text-[#333] mx-1">/</span>
                        <span className="text-[14px] text-[#666]">Projects</span>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-xs text-[#666] cursor-pointer transition-all duration-150 hover:border-[#333] hover:text-[#ccc]"
                    >
                        ← Dashboard
                    </button>
                </header>

                {/* ── Main ── */}
                <main className="max-w-[1100px] mx-auto px-6 pt-10 pb-20 anim-fadeUp">

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-[#ededed]">
                                All Projects
                            </h1>
                            {!loading && !fetchError && (
                                <p className="text-base text-[#555] mt-0.5">
                                    {projects.length}{" "}
                                    {projects.length === 1 ? "project" : "projects"} deployed
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Search bar — only when projects exist */}
                            {!loading && projects.length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#222] bg-[#111] w-full sm:w-56 transition-colors duration-150 focus-within:border-[#333]">
                                    <SearchIcon />
                                    <input
                                        className="flex-1 bg-transparent border-none outline-none text-base text-[#ededed] placeholder-[#444]"
                                        placeholder="Search projects..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch("")}
                                            className="text-white hover:text-white transition-colors text-xs"
                                            aria-label="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* View toggle */}
                            <div className="flex items-center gap-0.5 p-1 rounded-lg border border-[#222] bg-[#111]">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 ${viewMode === "grid"
                                        ? "bg-[#2a2a2a] text-[#ccc]"
                                        : "text-[#555] hover:text-[#999]"
                                        }`}
                                    title="Grid view"
                                >
                                    <GridIcon />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 ${viewMode === "list"
                                        ? "bg-[#2a2a2a] text-[#ccc]"
                                        : "text-[#555] hover:text-[#999]"
                                        }`}
                                    title="List view"
                                >
                                    <ListIcon />
                                </button>
                            </div>

                            {/* Add New */}
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-base font-medium cursor-pointer flex-shrink-0 transition-all duration-150 hover:opacity-90"
                                style={{
                                    background: "#fff",
                                    color: "#000"
                                }}
                            >
                                + Add New
                            </button>
                        </div>
                    </div>

                    {/* ── Content states ── */}

                    {/* API error */}
                    {fetchError && (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 select-none">
                            <div className="w-12 h-12 rounded-xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-xl">
                                ⚠️
                            </div>
                            <div className="text-center">
                                <div className="text-[14px] font-medium text-[#555]">
                                    Failed to load projects
                                </div>
                                <div className="text-base text-[#333] mt-1">
                                    Check your connection and try refreshing
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-base text-[#555] hover:text-[#ccc] transition-colors border border-[#222] px-3 py-1.5 rounded-lg"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading &&
                        (viewMode === "grid" ? <SkeletonGrid /> : <SkeletonList />)}

                    {/* Empty — no projects */}
                    {!loading && !fetchError && projects.length === 0 && (
                        <EmptyDeployments onNavigate={() => navigate("/dashboard")} />
                    )}

                    {/* Empty — search no results */}
                    {!loading &&
                        !fetchError &&
                        projects.length > 0 &&
                        filteredProjects.length === 0 && (
                            <EmptySearch search={search} onClear={() => setSearch("")} />
                        )}

                    {/* Project content */}
                    {!loading && !fetchError && filteredProjects.length > 0 && (
                        <>
                            {viewMode === "grid" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {visibleProjects.map((project) => (
                                        <ProjectCard
                                            key={project._id}
                                            project={project}
                                            onClick={() => setSelected(project)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-[#1e1e1e] rounded-xl overflow-hidden">
                                    <div className="flex flex-col divide-y divide-[#1a1a1a]">
                                        {visibleProjects.map((project) => (
                                            <ProjectRow
                                                key={project._id}
                                                project={project}
                                                onClick={() => setSelected(project)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#1a1a1a]">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-xs text-[#666] cursor-pointer transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#333] hover:text-[#ccc]"
                                    >
                                        ← Prev
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPage(idx)}
                                                aria-label={`Page ${idx + 1}`}
                                                className={`rounded-full transition-all duration-150 cursor-pointer border-0 p-0 ${idx === page
                                                    ? "bg-[#888] w-4 h-1.5"
                                                    : "bg-[#333] w-1.5 h-1.5 hover:bg-[#555]"
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        disabled={page === totalPages - 1}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-xs text-[#666] cursor-pointer transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#333] hover:text-[#ccc]"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </>
    );
}