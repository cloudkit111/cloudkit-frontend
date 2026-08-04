/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CloudKitLogo from '../assets/cloudkit-new.png';
import Navbar from '@/components/navbar/Navbar';
import { fetchUserDetails, handleLogout } from '@/services/userService';
import useTitle from '@/hooks/useTitle';
import { Server } from 'lucide-react'
import useAuthStore from '@/store/auth-store';

// ── Types ─────────────────────────────────────────────────────────────────────

type Project = {
    _id: string;
    project_url: string;
    slug: string;
    repoName: string;
    createdAt?: string;
    updatedAt?: string;
};

type NavUser = {
    fullname?: string;
    email?: string;
    avatar_url?: string;
    username?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeHostname(url?: string): string {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function repoInitials(name?: string): string {
    if (!name) return '??';
    const parts = name.replace(/[-_]/g, ' ').split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function stringToHash(str?: string): number {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    const mo = Math.floor(d / 30);
    return `${mo}mo ago`;
}

// Purely presentational — derives a "live / pending" badge from data we
// already have, without requiring any new API field.
function deriveStatus(project: Project): 'live' | 'pending' {
    return project?.project_url ? 'live' : 'pending';
}

function greetingForHour(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

// Deterministic decorative sparkline path — purely visual, no data dependency.
function sparklinePath(seed: string, width: number, height: number): string {
    const n = stringToHash(seed);
    const points = 8;
    const step = width / (points - 1);
    let d = '';
    for (let i = 0; i < points; i++) {
        const v = ((n >> (i * 3)) % 100) / 100;
        const x = i * step;
        const y = height - v * height * 0.8 - height * 0.1;
        d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }
    return d;
}

// ── Palette ───────────────────────────────────────────────────────────────────
// Matches the Apple system-color set already used across the app
// (accent #0071e3 in the navbar CTA, #34c759 in the status dot, etc).

const BRAND = '#0071e3';
const LIVE_COLOR = '#34c759';
const PENDING_COLOR = '#ff9500';

const PALETTE = [
    { tint: '#e8f2fe', ink: '#0071e3' },
    { tint: '#f2e9fb', ink: '#af52de' },
    { tint: '#e8f9ee', ink: '#248a3d' },
    { tint: '#fef3e6', ink: '#ff9500' },
    { tint: '#fde8ee', ink: '#ff375f' },
    { tint: '#e6f7fc', ink: '#0a84ff' },
];

function paletteFor(name: string) {
    return PALETTE[stringToHash(name) % PALETTE.length];
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCode({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M9 8 5 12l4 4M15 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconLayers({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m4 12 8 4.5 8-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m4 16.5 8 4.5 8-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconGlobe({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9Z" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function IconDatabase({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="2" />
            <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

const ICON_SET = [IconCode, IconDatabase, IconLayers, IconGlobe];

function iconFor(name: string) {
    return ICON_SET[stringToHash(name) % ICON_SET.length];
}

function ExternalLinkIcon({ className = '' }: { className?: string }) {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function GridIcon({ className = '' }: { className?: string }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function ListIcon({ className = '' }: { className?: string }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function SearchIcon({ className = '' }: { className?: string }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function DotsIcon({ className = '' }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="5" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="12" cy="19" r="1.6" fill="currentColor" />
        </svg>
    );
}

function CloseIcon({ className = '' }: { className?: string }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'live' | 'pending' }) {
    const isLive = status === 'live';
    return (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: isLive ? LIVE_COLOR : PENDING_COLOR }}
            />
            {isLive ? 'Live' : 'Pending'}
        </span>
    );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ seed, color }: { seed: string; color: string }) {
    const w = 64;
    const h = 24;
    const d = sparklinePath(seed, w, h);
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
            <path d={d} stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Project Card — Grid view ──────────────────────────────────────────────────

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
    const name = project?.repoName ?? project?.slug ?? 'Untitled';
    const hostname = safeHostname(project?.project_url);
    const ago = timeAgo(project?.updatedAt ?? project?.createdAt);
    const status = deriveStatus(project);
    const { tint, ink } = paletteFor(name);
    const Icon = iconFor(name);

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onClick();
            }}
            className="group flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: tint, color: ink }}
                    >
                        <Server className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold leading-tight text-foreground">
                            {name}
                        </div>
                        <div className="mt-1">
                            <StatusBadge status={status} />
                        </div>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    aria-label="Project options"
                >
                    <DotsIcon />
                </button>
            </div>

            <div className="my-4 h-px bg-border" />

            {hostname ? (
                <span className="truncate text-[13px] font-medium" style={{ color: BRAND }}>
                    {hostname}
                </span>
            ) : (
                <span className="text-[13px] text-muted-foreground">No URL configured</span>
            )}

            <div className="mt-3 flex items-end justify-between">
                <span className="text-[13px] text-muted-foreground">
                    {ago ? `Deployed ${ago}` : 'Deployed'}
                </span>
            </div>
        </div>
    );
}

// ── Project Row — List view ───────────────────────────────────────────────────

function ProjectRow({ project, onClick }: ProjectCardProps) {
    const name = project?.repoName ?? project?.slug ?? 'Untitled';
    const hostname = safeHostname(project?.project_url);
    const ago = timeAgo(project?.updatedAt ?? project?.createdAt);
    const status = deriveStatus(project);
    const { tint, ink } = paletteFor(name);
    const Icon = iconFor(name);

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onClick();
            }}
            className="group flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 hover:bg-muted focus:outline-none"
        >
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: tint, color: ink }}
                >
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold text-foreground">
                            {name}
                        </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[13px]">
                        {hostname && (
                            <span className="truncate font-medium" style={{ color: BRAND }}>
                                {hostname}
                            </span>
                        )}
                        {project?.slug && (
                            <>
                                <span className="text-border">·</span>
                                <span className="truncate text-muted-foreground">{project.slug}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden sm:block">
                <StatusBadge status={status} />
            </div>

            <span className="hidden w-24 flex-shrink-0 text-right text-[13px] text-muted-foreground md:block">
                {ago}
            </span>

            <div className="flex flex-shrink-0 items-center gap-2">
                {project?.project_url && (
                    <Link
                        to={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-150 hover:bg-background hover:text-foreground group-hover:opacity-100"
                        title="Open in new tab"
                    >
                        <ExternalLinkIcon />
                    </Link>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-background"
                >
                    View
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
    const name = project?.repoName ?? project?.slug ?? 'Untitled';
    const hostname = safeHostname(project?.project_url);
    const ago = timeAgo(project?.updatedAt ?? project?.createdAt);
    const status = deriveStatus(project);
    const { tint, ink } = paletteFor(name);
    const Icon = iconFor(name);

    const handleCopy = () => {
        navigator.clipboard
            .writeText(project?.project_url ?? '')
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
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={handleBackdrop}
        >
            <div className="animate-[modalIn_0.18s_ease-out_forwards] mx-4 w-full max-w-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl"
                            style={{ backgroundColor: tint, color: ink }}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-[16px] font-semibold text-foreground">{name}</div>
                            <div className="mt-0.5">
                                <StatusBadge status={status} />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-3 px-6 py-5">
                    {project?.project_url && (
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3">
                            <span
                                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{ backgroundColor: LIVE_COLOR }}
                            />
                            <span className="flex-1 truncate text-[13px] font-medium text-foreground">
                                {project.project_url}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="flex-shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-foreground transition-colors duration-150 hover:bg-background"
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border bg-muted px-4 py-3">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Domain
                            </div>
                            <div className="mt-1 truncate text-[13px] font-medium text-foreground">
                                {hostname || '—'}
                            </div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted px-4 py-3">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Subdomain
                            </div>
                            <div className="mt-1 truncate text-[13px] font-medium text-foreground">
                                {project?.slug || 'main'}
                            </div>
                        </div>
                        {ago && (
                            <div className="col-span-2 rounded-xl border border-border bg-muted px-4 py-3">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Last deployed
                                </div>
                                <div className="mt-1 text-[13px] font-medium text-foreground">{ago}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-background"
                    >
                        Close
                    </button>
                    {project?.project_url && (
                        <Link
                            to={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90"
                        >
                            Visit site
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                            <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
                        </div>
                    </div>
                    <div className="my-4 h-px bg-border" />
                    <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="mt-3 h-2.5 w-1/3 rounded bg-muted animate-pulse" />
                </div>
            ))}
        </div>
    );
}

function SkeletonList() {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 border-b border-border px-5 py-4 last:border-b-0"
                >
                    <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                        <div className="h-2.5 w-1/4 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyDeployments({ onNavigate }: { onNavigate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-28">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <img src={CloudKitLogo} className="h-7 w-7" alt="" />
            </div>
            <div className="text-center">
                <div className="text-[15px] font-semibold text-foreground">No deployments yet</div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                    Deploy your first project to see it here
                </div>
            </div>
            <button
                onClick={onNavigate}
                className="mt-1 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90"
            >
                Create your first project
            </button>
        </div>
    );
}

function EmptySearch({ search, onClear }: { search: string; onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <SearchIcon />
            </div>
            <div className="text-center">
                <div className="text-[14px] font-semibold text-foreground">No results found</div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                    No projects match &ldquo;{search}&rdquo;
                </div>
            </div>
            <button
                onClick={onClear}
                className="text-[13px] font-medium transition-opacity hover:opacity-70"
                style={{ color: BRAND }}
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
    useTitle('Cloudkit');
    const accessToken = useAuthStore((state) => state.accessToken);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Project | null>(null);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState<NavUser>();
    const [page, setPage] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [fetchError, setFetchError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log(accessToken)
        const loadUser = async () => {
            try {
                const res = await fetchUserDetails();
                setUser(res?.data);
            } catch (error) {
                console.error(error);
            }
        };
        loadUser();
        const fetchProjects = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URI}/api/projects`,
                    { withCredentials: true },
                );
                setProjects(res.data?.projects ?? []);
            } catch (err) {
                console.error('Failed to fetch projects:', err);
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
        const name = (p?.repoName ?? p?.slug ?? '').toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
    const visibleProjects = filteredProjects.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleModalClose = useCallback(() => setSelected(null), []);

    const liveCount = useMemo(
        () => projects.filter((p) => deriveStatus(p) === 'live').length,
        [projects],
    );

    const firstName = user?.fullname?.split(' ')?.[0];

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            {selected && <ProjectModal project={selected} onClose={handleModalClose} />}

            <div className="min-h-screen bg-[#fbfbfd] font-sans text-foreground">
                <Navbar variant="auth" user={user} onLogout={handleLogout} scrolled />
                <main className="mx-auto max-w-[1100px] animate-[fadeUp_0.35s_ease_forwards] px-6 pb-24 pt-28 sm:pt-32">
                    {/* Header */}
                    <div className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-[34px] font-semibold tracking-tight text-foreground sm:text-[40px]">
                                {greetingForHour()}
                                {firstName ? `, ${firstName}` : ''}.
                            </h1>
                            {!loading && !fetchError && (
                                <p className="mt-1.5 text-[15px] text-muted-foreground">
                                    You have {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                                    {liveCount > 0 ? `, ${liveCount} running live` : ''}.
                                </p>
                            )}
                            {!loading && !fetchError && projects.length > 0 && (
                                <button
                                    onClick={() => navigate('/deployments')}
                                    className="mt-3 text-[13px] font-medium transition-opacity hover:opacity-70"
                                    style={{ color: BRAND }}
                                >
                                    View all deployments
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {!loading && projects.length > 0 && (
                                <div className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 transition-colors duration-150 focus-within:border-foreground/20 sm:w-56">
                                    <SearchIcon className="text-muted-foreground" />
                                    <input
                                        className="flex-1 border-none bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
                                        placeholder="Search projects"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            className="text-muted-foreground transition-colors hover:text-foreground"
                                            aria-label="Clear search"
                                        >
                                            <CloseIcon />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 ${viewMode === 'grid'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="Grid view"
                                >
                                    <GridIcon />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 ${viewMode === 'list'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="List view"
                                >
                                    <ListIcon />
                                </button>
                            </div>

                            <button
                                onClick={() => navigate('/deploy-new-project')}
                                className="flex-shrink-0 rounded-full bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90"
                            >
                                + Add new
                            </button>
                        </div>
                    </div>

                    {/* Error state */}
                    {fetchError && (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                                <CloseIcon className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                                <div className="text-[14px] font-semibold text-foreground">
                                    Failed to load projects
                                </div>
                                <div className="mt-1 text-[13px] text-muted-foreground">
                                    Check your connection and try refreshing
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-muted"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {loading && (viewMode === 'grid' ? <SkeletonGrid /> : <SkeletonList />)}

                    {!loading && !fetchError && projects.length === 0 && (
                        <EmptyDeployments onNavigate={() => navigate('/deploy-new-project')} />
                    )}

                    {!loading && !fetchError && projects.length > 0 && filteredProjects.length === 0 && (
                        <EmptySearch search={search} onClear={() => setSearch('')} />
                    )}

                    {!loading && !fetchError && filteredProjects.length > 0 && (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {visibleProjects.map((project) => (
                                        <ProjectCard
                                            key={project._id}
                                            project={project}
                                            onClick={() => setSelected(project)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                                    <div className="flex flex-col divide-y divide-border">
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

                            {totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        ← Prev
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPage(idx)}
                                                aria-label={`Page ${idx + 1}`}
                                                className={`rounded-full border-0 p-0 transition-all duration-150 ${idx === page ? 'h-1.5 w-5 bg-primary' : 'h-1.5 w-1.5 bg-border hover:bg-muted-foreground/40'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        disabled={page === totalPages - 1}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
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