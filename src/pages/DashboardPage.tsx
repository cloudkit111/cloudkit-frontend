/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/cloudkit-new.png';
import api from '../config/api-client';
import { toast } from 'sonner';
import Navbar from '@/components/navbar/Navbar';
import Search from '@/assets/svg/Search';
import Private from '@/assets/svg/Private';
import { fetchUserDetails } from '@/services/userService';
import useTitle from '@/hooks/useTitle';

//===============================================================================================//
//===================================== MAIN DASHBOARD FILE =====================================//
//===============================================================================================//

const PAGE_SIZE = 5;

export default function DashboardPage() {
  useTitle('Dashboard')
  const [repos, setRepos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  // const isSavingInstall = useRef(false);

  const navigate = useNavigate();

  const fetchUser = async (): Promise<any> => {
    try {
      const res = await fetchUserDetails();
      setUser(res?.data);
      setRepos(res?.data.repos || []);
      return res?.data
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get(`${import.meta.env.VITE_BACKEND_URI}/auth/logout`, {
        withCredentials: true,
      });
      window.location.href = '/';
    } catch (err) {
      console.log(err);
    }
  };

  const handleImport = (repo: any) => {
    try {
      if (sessionStorage.getItem('deployment_url')) {
        sessionStorage.removeItem('deployment_url');
      }
      sessionStorage.setItem('deployment_url', repo?.clone_url);
      navigate('/deploy-project');
    } catch (error) {
      console.log(`Error during handling import ${error}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  };

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const installationId = params.get('installation_id');

      const userData = await fetchUser();
      console.log('userData:', userData);
      console.log('installationId:', installationId);
      // if (!userData) return;

      if (installationId) {
        // Save installation flow
        const toastId = toast.loading('Saving installation...');
        try {
          await api.post(
            `${import.meta.env.VITE_BACKEND_URI}/api/save-installation`,
            { installationId },
            { withCredentials: true },
          );
          await fetchUser();
          toast.dismiss(toastId);
          toast.success('GitHub App installed successfully!');
          window.history.replaceState({}, '', window.location.pathname);
        } catch (err) {
          toast.dismiss(toastId);
          toast.error('Failed to save installation. Please try again.');
        }
      } else if (!userData.installationId) {
        // Only redirect if NO installation_id in URL and user has none saved
        toast.info('Please install the CloudKit GitHub App to continue');
        setTimeout(() => {
          window.location.href = 'https://github.com/apps/cloudkit11/installations/new';
        }, 2000);
      }
    };

    init();
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
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : '??';

  return (
    <>
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
                      {Math.min((page + 1) * PAGE_SIZE, filteredRepos.length)}{' '}
                      of {filteredRepos.length}
                    </span>
                  )}
                </div>

                {/* GitHub account selector + Search bar */}
                <div className="flex gap-2 mb-3">
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#222] bg-[#111] min-w-0 flex-shrink-0"
                    style={{ minWidth: 0, width: '48%' }}
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
                      {user?.username ?? user?.fullname ?? 'Loading…'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#222] bg-[#111] flex-1 transition-colors duration-150 focus-within:border-[#333]">
                    <Search />
                    <input
                      className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder-[#444]"
                      style={{ fontFamily: 'inherit' }}
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
                            style={{ width: '55%' }}
                          />
                          <div
                            className="animate-shimmer h-2.5 rounded"
                            style={{ width: '30%' }}
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
                            {repo.private && <Private />}
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
                            ? 'bg-[#888] w-4'
                            : 'bg-[#333] w-1.5 hover:bg-[#555]'
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
