/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import logo from '../assets/cloudkit-new.png';
import api from '@/config/api-client';
import ConfettiCanvas from '@/components/canvas/ConfettiCanvas';
import DeployCanvas from '@/components/canvas/DeployCanvas';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LogLine } from '@/components/ui/LogLine';
import SuccessModal from '@/components/ui/SucessModal';
import PreviewFrame from '@/components/preview/PreviewFrame';
import { CircleArrowLeftDoubleIcon } from '@hugeicons/core-free-icons';
import useTitle from '@/hooks/useTitle';

// ── Init log messages shown before real logs arrive ───────────────────────
const INIT_MESSAGES = [
  'Initializing project environment…',
  'Fetching repository metadata…',
  'Resolving dependencies…',
  'Provisioning build container…',
  'Setting up file system…',
  'Preparing build pipeline…',
];

type Status = 'idle' | 'deploying' | 'success' | 'error';
type SubdomainMode = 'auto' | 'custom';
type EnvInputMode = 'form' | 'raw';

interface EnvVar {
  key: string;
  value: string;
  id: string;
}

// ── Main Deploy Page ──────────────────────────────────────────────────────
export default function DeployPage() {
  useTitle('Launch app')
  const githubRepoURL = sessionStorage.getItem('deployment_url') ?? '';
  const repoName =
    githubRepoURL.split('/').pop()?.replace('.git', '') ?? 'project';
  const deployLock = useRef(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [hasDeployed, setHasDeployed] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ── Subdomain ──
  const [subdomainMode, setSubdomainMode] = useState<SubdomainMode>('auto');
  const [customSlug, setCustomSlug] = useState('');
  const [customSlugError, setCustomSlugError] = useState('');

  // ── Environment Variables ──
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showEnvSection, setShowEnvSection] = useState(false);
  const [showEnvToast, setShowEnvToast] = useState(false);
  const [envInputMode, setEnvInputMode] = useState<EnvInputMode>('form');
  const [rawEnvText, setRawEnvText] = useState('');
  const [rawEnvError, setRawEnvError] = useState('');

  // ── Init phase & logs ──
  const [initLogs, setInitLogs] = useState<string[]>([]);
  const [isInitPhase, setIsInitPhase] = useState(false);
  const initTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const deployUrlRef = useRef('');
  const slugRef = useRef('');
  const hasStoredRef = useRef(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, initLogs]);

  // Confetti + modal on success
  useEffect(() => {
    if (status === 'success') {
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
        setStatus('error');
      } else if (
        /(^|\s)(success|done|completed|built|complete)(\s|$)/i.test(log)
      ) {
        setStatus('success');
      }
    };

    socket.on('message', handleMessage);
    return () => {
      socket.off('message', handleMessage);
    };
  }, []);

  // ── Slug validation ──
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setCustomSlug(sanitized);
    if (sanitized && sanitized.length < 3) {
      setCustomSlugError('Minimum 3 characters required');
    } else if (sanitized.startsWith('-') || sanitized.endsWith('-')) {
      setCustomSlugError('Cannot start or end with a hyphen');
    } else if (sanitized.includes('--')) {
      setCustomSlugError('Cannot contain consecutive hyphens');
    } else {
      setCustomSlugError('');
    }
  };

  // ── Env var form handlers ──
  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', id: Date.now().toString() }]);
  };

  const updateEnvVar = (id: string, field: 'key' | 'value', val: string) => {
    setEnvVars(
      envVars.map((env) => (env.id === id ? { ...env, [field]: val } : env)),
    );
  };

  const removeEnvVar = (id: string) => {
    setEnvVars(envVars.filter((env) => env.id !== id));
  };

  // ── Raw .env paste parser ──
  const parseRawEnv = (raw: string): EnvVar[] => {
    const lines = raw.split('\n');
    const result: EnvVar[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      // strip surrounding quotes from value
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key)
        result.push({ key, value, id: Date.now().toString() + Math.random() });
    }
    return result;
  };

  const applyRawEnv = () => {
    const parsed = parseRawEnv(rawEnvText);
    if (rawEnvText.trim() && parsed.length === 0) {
      setRawEnvError('No valid KEY=VALUE pairs found. Check your format.');
      return;
    }
    setRawEnvError('');
    setEnvVars(parsed);
    setEnvInputMode('form');
    if (parsed.length > 0) {
      setShowEnvToast(true);
      setTimeout(() => setShowEnvToast(false), 3000);
    }
  };

  const saveEnvVars = () => {
    const valid = envVars.filter((e) => e.key.trim() && e.value.trim());
    if (valid.length === 0) return;
    setShowEnvToast(true);
    setTimeout(() => setShowEnvToast(false), 3000);
  };

  // ── Deploy handler ──
  const handleDeploy = async () => {
    if (deployLock.current) return;

    if (subdomainMode === 'custom') {
      if (!customSlug || customSlug.trim().length < 3) {
        setCustomSlugError('Please enter a valid subdomain (min 3 characters)');
        return;
      }
      if (customSlug.startsWith('-') || customSlug.endsWith('-')) {
        setCustomSlugError('Cannot start or end with a hyphen');
        return;
      }
      if (customSlug.includes('--')) {
        setCustomSlugError('Cannot contain consecutive hyphens');
        return;
      }
    }

    deployLock.current = true;
    setHasDeployed(true);
    setStatus('deploying');
    setLogs([]);
    setInitLogs([]);

    // ── Start init phase ──
    setIsInitPhase(true);
    INIT_MESSAGES.forEach((msg, i) => {
      const t = setTimeout(() => {
        setInitLogs((prev) => [...prev, msg]);
      }, i * 1200);
      initTimersRef.current.push(t);
    });

    try {
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
          envs: envsObject,  // ← Always send it, even if empty {}
          ...(subdomainMode === 'custom' && customSlug
            ? { userSlug: customSlug }
            : {}),
        },
      );

      const url =
        res?.data?.data?.url ??
        res?.data?.data?.deployUrl ??
        res?.data?.url ??
        '';
      const slug = res?.data?.data?.projectSlug ?? '';

      if (url) {
        setDeployUrl(url);
        deployUrlRef.current = url;
      }
      slugRef.current = slug;

      const channel = `logs:${slug}`;
      const subscribe = () => socket.emit('subscribe', channel);
      if (socket.connected) subscribe();
      else socket.once('connect', subscribe);
    } catch (err: any) {
      setIsInitPhase(false);
      initTimersRef.current.forEach(clearTimeout);

      if (err?.response?.status === 409) {
        setCustomSlugError('This subdomain is already taken. Try another.');
        setSubdomainMode('custom');
        deployLock.current = false;
        setHasDeployed(false);
        setStatus('idle');
        return;
      }

      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.msg ??
        err?.message ??
        'Failed to start deployment.';
      setLogs((prev) => [...prev, `Error: ${msg}`]);
      setStatus('error');
    }
  };

  // Cleanup timers on unmount
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
        .log-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .log-scroll::-webkit-scrollbar-thumb:hover { background: #444; }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast-enter { animation: slideIn 0.3s ease forwards; }
        .segctl-btn { border: none; outline: none; }
      `}</style>

      <ConfettiCanvas active={showConfetti} />

      {/* ── Toast ── */}
      {showEnvToast && (
        <div className="fixed top-20 right-6 z-[100] toast-enter">
          <div className="bg-white border border-[#e5e5e7] rounded-xl px-4 py-3 flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="w-5 h-5 rounded-full bg-[#e8f9ee] flex items-center justify-center flex-shrink-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#34c759"
                strokeWidth="3"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[13px] text-[#1d1d1f] font-medium">
              Environment variables saved
            </span>
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
        className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]"
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        {/* ── Topbar ── */}
        <header className="h-14 border-b border-[#e5e5e7] flex items-center justify-between px-6 sticky top-0 z-50 bg-[rgba(251,251,253,0.8)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden">
              <img src={logo} alt="logo" className="w-full h-full object-contain" />
            </div>
            <span onClick={() => navigate('/')} className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] cursor-pointer">
              Cloudkit
            </span>
          </div>
          <button
            onClick={() => navigate('/deploy-new-project')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#e5e5e7] bg-[#f5f5f7] text-[13px] font-medium text-[#1d1d1f] cursor-pointer transition-all duration-150 hover:bg-[#ececee]"
          >
            ← Dashboard
          </button>
        </header>

        {/* ── Main ── */}
        <main className="max-w-[900px] mx-auto px-6 pt-12 pb-16 anim-fadeUp">
          {/* Heading */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-[#86868b] text-[12px] mb-3 tracking-wide uppercase font-medium">
              <span>New Deployment</span>
              <span>·</span>
              <span className="text-[#6e6e73] font-mono normal-case tracking-normal">{repoName}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-[#1d1d1f] leading-[1.15]">
              Deploy Project
            </h1>
            <p className="text-lg text-[#6e6e73] mt-2">
              Hit Deploy to build and ship your project to the edge.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">
            {/* ── LEFT: repo + subdomain + env ── */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="bg-white border border-[#e5e5e7] rounded-2xl shadow-[0_1px_0_rgba(0,0,0,0.02)] p-5">
                {/* Repository */}
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#86868b] font-semibold mb-3">
                  Repository
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center flex-shrink-0">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-[#6e6e73]"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#1d1d1f] truncate">
                      {repoName}
                    </div>
                    <div className="text-[11px] text-[#86868b] truncate mt-0.5 font-mono">
                      {githubRepoURL}
                    </div>
                  </div>
                </div>

                {/* ── Subdomain ── */}
                <div className="mt-5 pt-4 border-t border-[#e5e5e7]">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#86868b] font-semibold mb-3">
                    Subdomain
                  </div>

                  <div className="flex gap-1 bg-[#f5f5f7] border border-[#e5e5e7] rounded-lg p-1 w-fit mb-3">
                    {(['auto', 'custom'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          if (hasDeployed) return;
                          setSubdomainMode(m);
                          setCustomSlugError('');
                        }}
                        disabled={hasDeployed}
                        className="segctl-btn px-3.5 py-1 rounded-md text-[12px] font-medium transition-all duration-150 capitalize"
                        style={{
                          background:
                            subdomainMode === m ? '#ffffff' : 'transparent',
                          color: subdomainMode === m ? '#1d1d1f' : '#86868b',
                          boxShadow:
                            subdomainMode === m
                              ? '0 1px 2px rgba(0,0,0,0.08)'
                              : 'none',
                          cursor: hasDeployed ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {subdomainMode === 'auto' ? (
                    <div className="flex items-center bg-[#f5f5f7] border border-[#e5e5e7] rounded-lg overflow-hidden">
                      <span className="text-[13px] font-mono text-[#86868b] px-3 py-2 italic">
                        auto-generated
                      </span>
                      <span className="text-[13px] text-[#b0b0b5] py-2 pr-3">
                        .cloudkit.page
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div
                        className="flex items-center rounded-lg overflow-hidden transition-all duration-150 bg-[#f5f5f7]"
                        style={{
                          border: customSlugError
                            ? '1px solid #ff3b30'
                            : '1px solid #e5e5e7',
                        }}
                      >
                        <input
                          type="text"
                          value={customSlug}
                          onChange={handleSlugChange}
                          disabled={hasDeployed}
                          placeholder="my-awesome-project"
                          autoFocus
                          className="flex-1 bg-transparent text-[13px] font-mono text-[#1d1d1f] outline-none px-3 py-2 placeholder-[#b0b0b5]"
                          style={{
                            cursor: hasDeployed ? 'not-allowed' : 'text',
                          }}
                        />
                        <span className="text-[13px] text-[#86868b] py-2 pr-3 pl-0 whitespace-nowrap flex-shrink-0">
                          .cloudkit.page
                        </span>
                      </div>

                      {customSlugError ? (
                        <span className="text-[11px] text-[#ff3b30] pl-1 flex items-center gap-1">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                          </svg>
                          {customSlugError}
                        </span>
                      ) : customSlug ? (
                        <span className="text-[11px] text-[#1a9e4c] pl-1 flex items-center gap-1 font-mono">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                          {customSlug}.cloudkit.page
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#86868b] pl-1">
                          Only lowercase letters, numbers, and hyphens allowed.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Environment Variables ── */}
                <div className="mt-5 pt-4 border-t border-[#e5e5e7]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[#86868b] font-semibold">
                      Environment Variables
                    </div>
                    <button
                      onClick={() => setShowEnvSection(!showEnvSection)}
                      disabled={hasDeployed}
                      className="text-[11px] text-[#0071e3] hover:text-[#0077ed] transition-colors duration-150 flex items-center gap-1 font-medium"
                      style={{
                        cursor: hasDeployed ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {showEnvSection ? 'Hide' : 'Show'}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: showEnvSection
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {showEnvSection && (
                    <div className="space-y-3">
                      {/* ── Mode toggle: Form / Raw ── */}
                      <div className="flex gap-1 bg-[#f5f5f7] border border-[#e5e5e7] rounded-lg p-1 w-fit">
                        {(['form', 'raw'] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => {
                              if (hasDeployed) return;
                              setEnvInputMode(m);
                              setRawEnvError('');
                            }}
                            disabled={hasDeployed}
                            className="segctl-btn px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-150 capitalize"
                            style={{
                              background:
                                envInputMode === m ? '#ffffff' : 'transparent',
                              color: envInputMode === m ? '#1d1d1f' : '#86868b',
                              boxShadow:
                                envInputMode === m
                                  ? '0 1px 2px rgba(0,0,0,0.08)'
                                  : 'none',
                              cursor: hasDeployed ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {m === 'form' ? '⊞ Form' : '{ } Raw .env'}
                          </button>
                        ))}
                      </div>

                      {envInputMode === 'raw' ? (
                        /* ── Raw paste mode ── */
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={rawEnvText}
                            onChange={(e) => {
                              setRawEnvText(e.target.value);
                              setRawEnvError('');
                            }}
                            disabled={hasDeployed}
                            placeholder={
                              '# Paste your .env file here\nDATABASE_URL=postgresql://...\nNEXT_PUBLIC_API_KEY=abc123\nSECRET_KEY="my secret value"'
                            }
                            rows={8}
                            className="w-full bg-[#f5f5f7] border border-[#e5e5e7] rounded-lg px-3 py-2.5 text-[12px] font-mono text-[#1d1d1f] outline-none focus:border-[#0071e3] transition-colors placeholder-[#b0b0b5] resize-none"
                            style={{
                              cursor: hasDeployed ? 'not-allowed' : 'text',
                              lineHeight: '1.6',
                            }}
                          />
                          {rawEnvError && (
                            <span className="text-[11px] text-[#ff3b30] pl-1 flex items-center gap-1">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
                              {rawEnvError}
                            </span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#86868b] pl-1">
                              Comments (#) and quoted values are supported
                            </span>
                            <button
                              onClick={applyRawEnv}
                              disabled={hasDeployed || !rawEnvText.trim()}
                              className="px-3 py-1.5 rounded-lg bg-white border border-[#e5e5e7] text-[11px] text-[#1d1d1f] font-medium hover:border-[#c2c2c7] hover:bg-[#f5f5f7] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Apply →
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Form mode ── */
                        <div className="space-y-2">
                          {envVars.length === 0 && (
                            <p className="text-[11px] text-[#86868b] pl-1">
                              No variables added yet. Use Raw mode to paste from
                              .env or add manually below.
                            </p>
                          )}
                          {envVars.map((env) => (
                            <div key={env.id} className="flex gap-2">
                              <input
                                type="text"
                                value={env.key}
                                onChange={(e) =>
                                  updateEnvVar(env.id, 'key', e.target.value)
                                }
                                disabled={hasDeployed}
                                placeholder="KEY"
                                className="flex-1 bg-[#f5f5f7] border border-[#e5e5e7] rounded-lg px-3 py-2 text-[12px] font-mono text-[#1d1d1f] outline-none focus:border-[#0071e3] transition-colors placeholder-[#b0b0b5]"
                                style={{
                                  cursor: hasDeployed ? 'not-allowed' : 'text',
                                }}
                              />
                              <input
                                type="text"
                                value={env.value}
                                onChange={(e) =>
                                  updateEnvVar(env.id, 'value', e.target.value)
                                }
                                disabled={hasDeployed}
                                placeholder="value"
                                className="flex-1 bg-[#f5f5f7] border border-[#e5e5e7] rounded-lg px-3 py-2 text-[12px] font-mono text-[#1d1d1f] outline-none focus:border-[#0071e3] transition-colors placeholder-[#b0b0b5]"
                                style={{
                                  cursor: hasDeployed ? 'not-allowed' : 'text',
                                }}
                              />
                              <button
                                onClick={() => removeEnvVar(env.id)}
                                disabled={hasDeployed}
                                className="w-8 h-8 rounded-lg border border-[#e5e5e7] bg-[#f5f5f7] text-[#86868b] hover:text-[#ff3b30] hover:border-[#ff3b30]/30 transition-all duration-150 flex items-center justify-center flex-shrink-0"
                                style={{
                                  cursor: hasDeployed
                                    ? 'not-allowed'
                                    : 'pointer',
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}

                          <button
                            onClick={addEnvVar}
                            disabled={hasDeployed}
                            className="w-full py-2 rounded-lg border border-dashed border-[#d2d2d7] bg-[#f5f5f7] text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] hover:border-[#b0b0b5] transition-all duration-150 flex items-center justify-center gap-1.5"
                            style={{
                              cursor: hasDeployed ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Variable
                          </button>

                          {envVars.length > 0 && (
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-[10px] text-[#86868b] pl-1">
                                {
                                  envVars.filter(
                                    (e) => e.key.trim() && e.value.trim(),
                                  ).length
                                }{' '}
                                variable(s) ready
                              </div>
                              <button
                                onClick={saveEnvVars}
                                disabled={
                                  hasDeployed ||
                                  envVars.filter(
                                    (e) => e.key.trim() && e.value.trim(),
                                  ).length === 0
                                }
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#e5e5e7] text-[11px] text-[#1d1d1f] font-medium hover:border-[#c2c2c7] hover:bg-[#f5f5f7] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Deploy URL card — only after success */}
              {status === 'success' && deployUrl && (
                <div className="bg-white border border-[#34c759]/25 rounded-xl p-4 flex items-center gap-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                  <span className="w-2 h-2 rounded-full bg-[#34c759] flex-shrink-0 animate-pulse" />
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-[13px] font-mono text-[#0071e3] truncate hover:text-[#0077ed] transition-colors duration-150"
                  >
                    {deployUrl}
                  </a>
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#e5e5e7] bg-[#f5f5f7] text-[#1d1d1f] font-medium cursor-pointer transition-all duration-150 hover:bg-[#ececee] no-underline"
                  >
                    Visit →
                  </a>
                </div>
              )}
            </div>

            {/* ── RIGHT: canvas + deploy button ── */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div
                className="bg-white border border-[#e5e5e7] rounded-2xl overflow-hidden flex flex-col shadow-[0_1px_0_rgba(0,0,0,0.02)]"
                style={{ minHeight: 180 }}
              >
                {status === 'success' && deployUrl ? (
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
                      <div className="text-[11px] text-[#86868b] mt-1">
                        {status === 'idle' && 'Awaiting deployment'}
                        {status === 'deploying' && 'Building your project…'}
                        {status === 'error' && 'Something went wrong'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleDeploy}
                disabled={hasDeployed}
                className="px-3 py-3 rounded-full bg-[#0071e3] text-white text-[15px] font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:bg-[#0077ed] active:scale-[0.97]"
                style={{
                  cursor: hasDeployed ? 'not-allowed' : 'pointer',
                  opacity: hasDeployed ? 0.5 : 1,
                }}
              >
                {hasDeployed ? (
                  status === 'deploying' ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                      Deploying…
                    </>
                  ) : status === 'success' ? (
                    '✓ Deployed'
                  ) : status === 'error' ? (
                    '✗ Failed'
                  ) : (
                    'Deployed'
                  )
                ) : (
                  <>Deploy</>
                )}
              </button>

              {status === 'success' && !showModal && (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-2 rounded-xl border border-[#34c759]/30 bg-[#f0faf3] text-[12px] text-[#1a9e4c] font-medium cursor-pointer transition-all duration-150 hover:bg-[#e6f7ea]"
                >
                  🎉 View deployment summary
                </button>
              )}
            </div>
          </div>

          {/* ── Logs panel ── */}
          <div className="bg-[#1d1d1f] border border-[#e5e5e7]/10 rounded-2xl overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[11px] text-white/35 tracking-wide uppercase ml-1">
                  Build Logs
                </span>
              </div>
              <div className="flex items-center gap-3">
                {(logs.length > 0 || initLogs.length > 0) && (
                  <span className="text-[10px] text-white/25 font-mono">
                    {logs.length + initLogs.length} lines
                  </span>
                )}
                <StatusBadge status={status} />
              </div>
            </div>

            <div
              className="log-scroll overflow-y-auto px-5 py-4 font-mono"
              style={{ height: 320, backgroundColor: '#151517' }}
            >
              {!hasDeployed ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 select-none">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white/15"
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
                  <span className="text-[12px] text-white/25">
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
                // ── Init phase with dripping messages + blink cursor ──
                <div className="flex flex-col gap-0.5">
                  {initLogs.map((line, i) => (
                    <LogLine key={i} line={line} isInit />
                  ))}
                  <div className="flex gap-2 mt-1">
                    <span className="text-white/20 text-[11px]">›</span>
                    <span
                      className="text-[12.5px] font-mono text-white/20"
                      style={{ animation: 'blink 1s step-end infinite' }}
                    >
                      ▌
                    </span>
                  </div>
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>

            {logs.length > 0 && (
              <div className="px-5 py-2.5 border-t border-white/[0.06] flex items-center justify-between bg-[#1a1a1c]">
                <span className="text-[10px] text-white/25 font-mono">
                  {status === 'deploying' ? '● live stream' : '● ended'}
                </span>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-white/25 hover:text-white/60 transition-colors duration-100 cursor-pointer"
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