import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/navbar/Navbar';
import { LogLine } from '@/components/ui/LogLine';
import { fetchUserDetails, handleLogout } from '@/services/userService';
import { socket } from '../utils/socket';
import useTitle from '@/hooks/useTitle';

// ── Types ─────────────────────────────────────────────────────────────────────

type Project = {
    _id: string;
    project_url: string;
    slug: string;
    repoName: string;
    gitURL?: string;
    createdAt?: string;
    updatedAt?: string;
};

type Commit = {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
};

type NavUser = {
    fullname?: string;
    email?: string;
    avatar_url?: string;
    username?: string;
};

type LogStatus = 'idle' | 'connecting' | 'live' | 'ended' | 'error';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function safeHostname(url?: string): string {
    if (!url) return '';
    try { return new URL(url).hostname; } catch { return url; }
}

function repoInitials(name?: string): string {
    if (!name) return '??';
    const parts = name.replace(/[-_]/g, ' ').split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function parseGithubRepo(gitURL?: string): { owner: string; repo: string } | null {
    if (!gitURL) return null;
    try {
        const url = new URL(gitURL.replace(/\.git$/, ''));
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
    } catch { /* ignore */ }
    return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Monogram({ name, size = 32 }: { name: string; size?: number }) {
    return (
        <div
            className="rounded-lg flex items-center justify-center font-semibold select-none flex-shrink-0 text-[#6e6e73] border border-[#e5e5e7] bg-[#f5f5f7]"
            style={{ width: size, height: size, fontSize: size * 0.32 }}
        >
            {repoInitials(name)}
        </div>
    );
}

function StatusDot({ status }: { status: LogStatus }) {
    const colors: Record<LogStatus, string> = {
        idle: '#86868b',
        connecting: '#ff9500',
        live: '#34c759',
        ended: '#86868b',
        error: '#ff3b30',
    };
    const labels: Record<LogStatus, string> = {
        idle: 'idle',
        connecting: 'connecting…',
        live: 'live',
        ended: 'ended',
        error: 'error',
    };
    return (
        <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: colors[status] }}>
            <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                    background: colors[status],
                    animation: status === 'live' || status === 'connecting' ? 'pulse 1.4s ease-in-out infinite' : 'none',
                }}
            />
            {labels[status]}
        </span>
    );
}

function CommitRow({ commit }: { commit: Commit }) {
    return (
        <a
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors duration-100 group no-underline"
        >
            <div className="w-7 h-7 rounded-full bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="4" stroke="#86868b" strokeWidth="2" />
                    <path d="M12 2v6M12 16v6M2 12h6M16 12h6" stroke="#86868b" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[#1d1d1f] leading-snug truncate group-hover:text-[#0071e3] transition-colors">
                    {commit.message}
                </p>
                <p className="text-[11px] text-[#86868b] mt-0.5 font-mono">
                    {commit.author} · {timeAgo(commit.date)}
                </p>
            </div>
            <span className="text-[10px] font-mono text-[#86868b] group-hover:text-[#0071e3] flex-shrink-0 mt-0.5 transition-colors">
                {commit.sha.slice(0, 7)}
            </span>
        </a>
    );
}

// ── Project Row ───────────────────────────────────────────────────────────────

interface ProjectRowProps {
    project: Project;
    selected: boolean;
    onClick: () => void;
}

function ProjectRow({ project, selected, onClick }: ProjectRowProps) {
    const name = project.repoName ?? project.slug ?? 'Untitled';
    const ago = timeAgo(project.updatedAt ?? project.createdAt);
    const hostname = safeHostname(project.project_url);

    return (
        <div
            onClick={onClick}
            className="relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 group border-b border-[#e5e5e7] last:border-b-0"
            style={{ background: selected ? '#f5f5f7' : 'transparent' }}
            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#fafafc'; }}
            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
            {/* Active indicator bar */}
            <div
                className="absolute left-0 w-0.5 h-8 rounded-full transition-opacity duration-150"
                style={{ background: '#0071e3', opacity: selected ? 1 : 0 }}
            />
            <Monogram name={name} size={34} />
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{name}</p>
                {hostname && (
                    <p className="text-[11px] text-[#86868b] font-mono truncate mt-0.5">{hostname}</p>
                )}
            </div>
            {ago && <span className="text-[11px] text-[#86868b] flex-shrink-0">{ago}</span>}
            <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                className="flex-shrink-0 transition-all duration-150"
                style={{ color: selected ? '#0071e3' : '#c7c7cc', transform: selected ? 'translateX(0)' : 'translateX(-4px)', opacity: selected ? 1 : 0.6 }}
            >
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
    project: Project;
    onClose: () => void;
}

function DetailPanel({ project, onClose }: DetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'logs' | 'commits'>('logs');
    const [logs, setLogs] = useState<string[]>([]);
    const [logStatus, setLogStatus] = useState<LogStatus>('idle');
    const [commits, setCommits] = useState<Commit[]>([]);
    const [commitsLoading, setCommitsLoading] = useState(false);
    const [commitsError, setCommitsError] = useState('');
    const logsEndRef = useRef<HTMLDivElement>(null);
    const subscribedRef = useRef(false);
    const name = project.repoName ?? project.slug ?? 'Untitled';

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // WebSocket log subscription
    useEffect(() => {
        if (!project.slug) return;

        setLogStatus('connecting');
        setLogs([]);
        subscribedRef.current = false;

        const channel = `logs:${project.slug}`;

        const handleMessage = (data: string) => {
            let log = data;
            try {
                const parsed = JSON.parse(data);
                log = parsed.log ?? data;
            } catch { /* raw string */ }

            setLogs(prev => [...prev, log]);
            setLogStatus('live');

            if (/(^|\s)(error|fail|failed)(\s|$)/i.test(log)) setLogStatus('error');
            else if (/(^|\s)(success|done|completed|built|complete)(\s|$)/i.test(log)) setLogStatus('ended');
        };

        const subscribe = () => {
            if (!subscribedRef.current) {
                socket.emit('subscribe', channel);
                subscribedRef.current = true;
            }
        };

        socket.on('message', handleMessage);

        if (socket.connected) subscribe();
        else socket.once('connect', subscribe);

        return () => {
            socket.off('message', handleMessage);
            socket.emit('unsubscribe', channel);
            subscribedRef.current = false;
        };
    }, [project.slug]);

    // Fetch GitHub commits
    useEffect(() => {
        const parsed = parseGithubRepo(project.gitURL);
        if (!parsed) return;

        setCommitsLoading(true);
        setCommitsError('');

        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=15`)
            .then(res => {
                if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
                return res.json();
            })
            .then((data: any[]) => {
                setCommits(data.map(c => ({
                    sha: c.sha,
                    message: c.commit?.message?.split('\n')[0] ?? '',
                    author: c.commit?.author?.name ?? c.author?.login ?? 'unknown',
                    date: c.commit?.author?.date ?? '',
                    url: c.html_url,
                })));
            })
            .catch(err => setCommitsError(err.message))
            .finally(() => setCommitsLoading(false));
    }, [project.gitURL]);

    return (
        <div className="flex flex-col h-full">
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e5e5e7] flex-shrink-0">
                <Monogram name={name} size={36} />
                <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-semibold text-[#1d1d1f] truncate">{name}</h2>
                    {project.project_url && (
                        <a
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-[#86868b] hover:text-[#0071e3] transition-colors truncate block"
                        >
                            {safeHostname(project.project_url)}
                        </a>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {project.project_url && (
                        <a
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-full bg-[#0071e3] text-white text-[12px] font-medium cursor-pointer transition-colors duration-150 hover:bg-[#0077ed] no-underline"
                        >
                            Visit →
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full border border-[#e5e5e7] bg-[#f5f5f7] flex items-center justify-center text-[#86868b] cursor-pointer transition-all duration-150 hover:border-[#d2d2d7] hover:text-[#1d1d1f] text-sm"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-[#e5e5e7] flex-shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" fill="#86868b" />
                    </svg>
                    <span className="text-[11px] text-[#86868b] font-mono truncate max-w-[200px]">
                        {project.gitURL ? parseGithubRepo(project.gitURL)?.owner + '/' + parseGithubRepo(project.gitURL)?.repo : project.slug}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                    <span className="text-[11px] text-[#86868b]">deployed {timeAgo(project.updatedAt ?? project.createdAt)}</span>
                </div>
                <div className="text-[11px] font-mono text-[#86868b]">{project.slug}</div>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-0 px-5 border-b border-[#e5e5e7] flex-shrink-0">
                {(['logs', 'commits'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2.5 text-[12px] font-medium capitalize transition-all duration-150 -mb-px cursor-pointer bg-transparent"
                        style={{
                            color: activeTab === tab ? '#1d1d1f' : '#86868b',
                            borderBottom: activeTab === tab ? '2px solid #0071e3' : '2px solid transparent',
                        }}
                    >
                        {tab === 'logs' ? (
                            <span className="flex items-center gap-1.5">
                                Build Logs
                                {activeTab === 'logs' && <StatusDot status={logStatus} />}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                Git Commits
                                {commits.length > 0 && (
                                    <span className="text-[10px] bg-[#f5f5f7] text-[#6e6e73] px-1.5 py-0.5 rounded-full border border-[#e5e5e7]">
                                        {commits.length}
                                    </span>
                                )}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">

                {/* ── Logs Tab ── */}
                {activeTab === 'logs' && (
                    <div className="flex flex-col h-full">
                        {/* macOS-style terminal header (kept dark — reads as a real terminal even on a light page) */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/20 bg-[#1d1d1f] flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                                </div>
                                <span className="text-[10px] text-white/35 tracking-wider uppercase ml-1">terminal</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {logs.length > 0 && (
                                    <span className="text-[10px] font-mono text-white/30">{logs.length} lines</span>
                                )}
                                <StatusDot status={logStatus} />
                                {logs.length > 0 && (
                                    <button
                                        onClick={() => setLogs([])}
                                        className="text-[10px] text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div
                            className="flex-1 overflow-y-auto px-4 py-3 font-mono bg-[#121214] log-scroll"
                            style={{ minHeight: 0 }}
                        >
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-3 select-none py-12">
                                    {logStatus === 'connecting' ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/15 border-t-white/40 rounded-full animate-spin" />
                                            <span className="text-[12px] text-white/30 font-mono">Connecting to log stream…</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/15">
                                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            <span className="text-[12px] text-white/30 font-mono">
                                                Waiting for logs from <span className="text-white/45">{project.slug}</span>…
                                            </span>
                                            <span className="text-[10px] text-white/20 font-mono">
                                                Live logs will appear here when a deployment is triggered
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-0.5">
                                    {logs.map((line, i) => (
                                        <LogLine key={i} line={line} />
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>

                        {logs.length > 0 && (
                            <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between bg-[#18181a] flex-shrink-0">
                                <span className="text-[10px] text-white/30 font-mono">
                                    {logStatus === 'live' ? '● live stream' : `● ${logStatus}`}
                                </span>
                                <span className="text-[10px] text-white/30 font-mono">{project.slug}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Commits Tab ── */}
                {activeTab === 'commits' && (
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {commitsLoading && (
                            <div className="flex flex-col gap-0">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e5e7]">
                                        <div className="animate-shimmer w-7 h-7 rounded-full flex-shrink-0" />
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <div className="animate-shimmer h-3 rounded" style={{ width: `${45 + i * 7}%` }} />
                                            <div className="animate-shimmer h-2.5 rounded" style={{ width: '28%' }} />
                                        </div>
                                        <div className="animate-shimmer w-10 h-3 rounded" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!commitsLoading && commitsError && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                                <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center text-lg">⚠️</div>
                                <p className="text-[13px] text-[#6e6e73]">Could not load commits</p>
                                <p className="text-[11px] text-[#86868b]">{commitsError}</p>
                                {!project.gitURL && (
                                    <p className="text-[11px] text-[#86868b]">No gitURL found on this project</p>
                                )}
                            </div>
                        )}

                        {!commitsLoading && !commitsError && commits.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <p className="text-[13px] text-[#6e6e73]">No commits found</p>
                            </div>
                        )}

                        {!commitsLoading && commits.length > 0 && (
                            <div className="flex flex-col divide-y divide-[#e5e5e7]">
                                {commits.map(commit => (
                                    <CommitRow key={commit.sha} commit={commit} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const DeploymentsPage = () => {
    useTitle('Deployments')
    const [user, setUser] = useState<NavUser>();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [selected, setSelected] = useState<Project | null>(null);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await fetchUserDetails();
                setUser(res?.data);
            } catch { /* silent */ }
        };
        loadUser();

        const fetchProjects = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URI}/api/projects`,
                    { withCredentials: true },
                );
                const list: Project[] = res.data?.projects ?? [];
                setProjects(list);
                if (list.length > 0) setSelected(list[0]);
            } catch {
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p => {
        const name = (p.repoName ?? p.slug ?? '').toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const handleSelect = useCallback((p: Project) => setSelected(p), []);
    const handleClose = useCallback(() => setSelected(null), []);

    return (
        <>
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .anim-fadeUp { animation: fadeUp 0.3s ease forwards; }
        .animate-shimmer {
          background: linear-gradient(90deg, #f0f0f2 25%, #f7f7f8 50%, #f0f0f2 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .log-scroll::-webkit-scrollbar { width: 4px; }
        .log-scroll::-webkit-scrollbar-track { background: transparent; }
        .log-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .log-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
      `}</style>

            <div
                className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] flex flex-col"
                style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" }}
            >
                <Navbar variant="auth" user={user} scrolled onLogout={handleLogout} />

                <main className="flex-1 mt-10 flex flex-col max-w-[1200px] w-full mx-auto px-6 pt-10 pb-6 anim-fadeUp min-h-0">

                    {/* Page title */}
                    <div className="flex items-center justify-between mb-6 flex-shrink-0 flex-wrap gap-3">
                        <div>
                            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">Deployments</h1>
                            {!loading && !fetchError && (
                                <p className="text-[13px] text-[#6e6e73] mt-0.5">
                                    {projects.length} {projects.length === 1 ? 'project' : 'projects'} · click a project to view logs and commits
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/projects')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#e5e5e7] bg-[#f5f5f7] text-[13px] text-[#1d1d1f] cursor-pointer transition-all duration-150 hover:bg-[#ececee]"
                            >
                                ← All Projects
                            </button>
                            <button
                                onClick={() => navigate('/deploy-new-project')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0071e3] text-white text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-[#0077ed]"
                            >
                                + New Deployment
                            </button>
                        </div>
                    </div>

                    {/* Error state */}
                    {fetchError && (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center text-xl">⚠️</div>
                            <p className="text-[14px] text-[#6e6e73]">Failed to load projects</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-sm text-[#1d1d1f] hover:bg-[#ececee] border border-[#e5e5e7] bg-[#f5f5f7] px-3.5 py-1.5 rounded-full transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !fetchError && projects.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center text-2xl">🚀</div>
                            <div className="text-center">
                                <p className="text-[15px] font-medium text-[#1d1d1f]">No deployments yet</p>
                                <p className="text-[13px] text-[#6e6e73] mt-1">Deploy your first project to see it here</p>
                            </div>
                            <button
                                onClick={() => navigate('/deploy-new-project')}
                                className="mt-2 px-4 py-2 rounded-full bg-[#0071e3] text-white text-sm font-medium cursor-pointer transition-colors duration-150 hover:bg-[#0077ed]"
                            >
                                Create first deployment
                            </button>
                        </div>
                    )}

                    {/* Main split layout */}
                    {(loading || (!fetchError && projects.length > 0)) && (
                        <div
                            className="flex-1 min-h-0 flex gap-4 rounded-2xl border border-[#e5e5e7] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)] overflow-hidden"
                            style={{ height: 'calc(100vh - 200px)' }}
                        >
                            {/* Left: project list */}
                            <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-[#e5e5e7] bg-[#fbfbfd]">
                                {/* Search */}
                                <div className="px-3 py-3 border-b border-[#e5e5e7] flex-shrink-0">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#e5e5e7] bg-[#f5f5f7] focus-within:border-[#0071e3] transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                            <circle cx="11" cy="11" r="8" stroke="#86868b" strokeWidth="2" />
                                            <path d="m21 21-4.35-4.35" stroke="#86868b" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        <input
                                            className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#1d1d1f] placeholder-[#86868b]"
                                            placeholder="Filter projects…"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                        {search && (
                                            <button onClick={() => setSearch('')} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors text-[10px]">✕</button>
                                        )}
                                    </div>
                                </div>

                                {/* Project list */}
                                <div className="flex-1 overflow-y-auto min-h-0 relative">
                                    {loading && (
                                        <div className="flex flex-col">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e5e5e7]">
                                                    <div className="animate-shimmer w-8 h-8 rounded-lg flex-shrink-0" />
                                                    <div className="flex-1 flex flex-col gap-1.5">
                                                        <div className="animate-shimmer h-3 rounded" style={{ width: '55%' }} />
                                                        <div className="animate-shimmer h-2.5 rounded" style={{ width: '35%' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!loading && filteredProjects.length === 0 && search && (
                                        <div className="flex flex-col items-center justify-center py-12 gap-2 px-4 text-center">
                                            <p className="text-[12px] text-[#6e6e73]">No projects match</p>
                                            <p className="text-[11px] text-[#86868b]">"{search}"</p>
                                        </div>
                                    )}

                                    {!loading && filteredProjects.map(p => (
                                        <ProjectRow
                                            key={p._id}
                                            project={p}
                                            selected={selected?._id === p._id}
                                            onClick={() => handleSelect(p)}
                                        />
                                    ))}
                                </div>

                                {/* Footer */}
                                {!loading && projects.length > 0 && (
                                    <div className="px-4 py-2.5 border-t border-[#e5e5e7] flex-shrink-0">
                                        <p className="text-[10px] text-[#86868b] font-mono">{projects.length} projects total</p>
                                    </div>
                                )}
                            </div>

                            {/* Right: detail panel */}
                            <div className="flex-1 min-w-0 flex flex-col bg-white">
                                {selected ? (
                                    <DetailPanel key={selected._id} project={selected} onClose={handleClose} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none text-center px-8">
                                        <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#c7c7cc" strokeWidth="1.5" />
                                                <path d="M7 8h10M7 12h7M7 16h5" stroke="#c7c7cc" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-medium text-[#6e6e73]">Select a project</p>
                                            <p className="text-[12px] text-[#86868b] mt-1">Choose a project from the left to view its deployment logs and git commits</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default DeploymentsPage;