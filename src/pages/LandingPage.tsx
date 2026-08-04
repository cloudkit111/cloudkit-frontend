'use client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import BottomCallToAction from '@/components/bottom/BottomCallToAction';
import Stats from '@/components/bottom/Stats';
import useTitle from '@/hooks/useTitle';
import { type StatType } from '@/types';
import { Button } from '@/components/ui/button';
import { handleLogout } from '@/services/userService';

/* ─────────────────────────────────────────────
   Hero Cloud Symbol — quiet, glassy, Apple-ish
───────────────────────────────────────────── */
function HeroCloud() {
  return (
    <div
      className="ck-float"
      style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}
    >
      <svg
        viewBox="0 0 260 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: 'clamp(140px, 22vw, 220px)',
          height: 'auto',
          filter: 'drop-shadow(0 20px 40px rgba(0,113,227,0.14))',
        }}
      >
        <defs>
          <linearGradient id="cloudGradApple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0071e3" />
            <stop offset="100%" stopColor="#66b2ff" />
          </linearGradient>
        </defs>
        <path
          d="M196 130a37 37 0 0 0-33-37A57 57 0 0 0 44 130a37 37 0 0 0 0 74h152a37 37 0 0 0 0-74z"
          fill="url(#cloudGradApple)"
          opacity="0.08"
        />
        <path
          d="M196 130a37 37 0 0 0-33-37A57 57 0 0 0 44 130a37 37 0 0 0 0 74h152a37 37 0 0 0 0-74z"
          fill="none"
          stroke="url(#cloudGradApple)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const techs = [
    "React",
    "Vite",
    "Single Page Apps",
    "Web Applications",
    "Frontend Apps",
    "Websites",
    "Web Design",
    "React",
    "Vite",
    "Single Page Apps",
    "Web Applications",
    "Frontend Apps",
    "Websites",
    "Web Design"
  ];
  const marqueeItems = [...techs, ...techs];

  const features = [
    {
      iconBg: '#f5a623',
      title: 'Git Push Deploys',
      desc: 'Connect your repository and Cloudkit automatically builds and deploys every commit with minimal setup.',
    },
    {
      iconBg: '#0071e3',
      title: 'Global CDN Delivery',
      desc: 'Static assets are cached and delivered through Render’s global CDN with HTTP/2 and Brotli compression.',
    },
    {
      iconBg: '#34c759',
      title: 'Automatic HTTPS',
      desc: 'Every deployment gets free TLS certificates, secure HTTPS connections, and built-in DDoS protection.',
    },
    {
      iconBg: '#af52de',
      title: 'Instant Rollbacks',
      desc: 'Redeploy previous builds instantly if a deployment breaks production or introduces regressions.',
    },
    {
      iconBg: '#ff3b30',
      title: 'Framework Ready',
      desc: 'Works out of the box with React, Vite. Coming soon with other modern JavaScript frameworks.',
    },
    {
      iconBg: '#00c7be',
      title: 'Continuous Deployment',
      desc: 'Deploy automatically on every push to your production branch with zero manual release steps.',
    },
  ];

  const stats: StatType[] = [
    { value: 'Best-effort', label: 'Uptime SLA' },
    { value: 'Global CDN', label: 'Edge delivery' },
    { value: '~1 min', label: 'Cold start wake-up' },
    { value: '750 hrs/mo', label: 'Free compute' },
  ];

  const navigate = useNavigate();

  useTitle('Cloudkit')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        html, body { background: #fbfbfd !important; color: #1d1d1f !important; margin: 0; padding: 0; }
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes softGlow { 0%,100%{opacity:.5} 50%{opacity:.9} }

        .ck-fade-up   { animation: fadeUp .8s cubic-bezier(.22,1,.36,1) both; }
        .ck-fade-up-1 { animation: fadeUp .8s .08s cubic-bezier(.22,1,.36,1) both; }
        .ck-fade-up-2 { animation: fadeUp .8s .16s cubic-bezier(.22,1,.36,1) both; }
        .ck-fade-up-3 { animation: fadeUp .8s .24s cubic-bezier(.22,1,.36,1) both; }
        .ck-float     { animation: float 7s ease-in-out infinite; }
        .ck-marquee   { animation: marquee 28s linear infinite; display:flex; gap:10px; width:max-content; }
        .ck-marquee:hover { animation-play-state: paused; }

        @media (prefers-reduced-motion: reduce) {
          .ck-fade-up, .ck-fade-up-1, .ck-fade-up-2, .ck-fade-up-3, .ck-float, .ck-marquee { animation: none !important; }
        }

        .ck-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle at 50% 0%, rgba(0,113,227,0.05), transparent 60%);
        }

        .ck-marquee-mask {
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
        }

        .ck-card {
          background: #ffffff;
          border: 1px solid #e5e5e7;
          border-radius: 20px;
          transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
        }
        .ck-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.06);
          border-color: #d2d2d7;
        }

        .ck-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 13px 28px; background: #0071e3; color: #ffffff;
          font-size: 16px; font-weight: 500; border-radius: 980px; border: none;
          cursor: pointer; font-family: inherit; letter-spacing: -0.01em;
          transition: background .2s ease, transform .2s ease;
        }
        .ck-btn-primary:hover { background: #0077ed; }
        .ck-btn-primary:active { transform: scale(0.98); }
        .ck-btn-primary:focus-visible { outline: 2px solid #0071e3; outline-offset: 3px; }

        .ck-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; background: rgba(0,113,227,0.08);
          border: 1px solid rgba(0,113,227,0.18); border-radius: 999px;
          font-size: 13px; font-weight: 500; color: #0071e3;
        }

        .ck-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f5f5f7; border: 1px solid #e5e5e7;
          border-radius: 8px; padding: 2px 10px; font-size: 0.82em; color: #1d1d1f;
        }

        .ck-icon-dot {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }

        /* Responsive grids */
        .ck-features { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .ck-stats    { display: grid; grid-template-columns: repeat(4,1fr); gap: 32px; text-align: center; max-width: 860px; margin: 0 auto; }

        @media (max-width: 900px) { .ck-features { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 560px) { .ck-features { grid-template-columns: 1fr; } .ck-stats { grid-template-columns: repeat(2,1fr); gap: 24px; } }
      `}</style>

      {/* ROOT */}
      <div
        style={{
          minHeight: '100vh',
          background: '#fbfbfd',
          color: '#1d1d1f',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
          overflowX: 'hidden',
        }}
      >
        <Navbar variant="guest" scrolled={scrolled} onLogout={handleLogout} />

        {/* ── HERO ── */}
        <section
          style={{
            position: 'relative',
            minHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 'clamp(100px,14vw,140px) 24px 80px',
            overflow: 'hidden',
          }}
        >
          <div className="ck-grid-bg" aria-hidden="true" />

          {/* Hero content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 780,
              width: '100%',
            }}
          >
            <div className="ck-fade-up" style={{ marginBottom: 24 }}>
              <span className="ck-chip">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#0071e3',
                    display: 'inline-block',
                  }}
                />
                Now in public beta v1.1.3
              </span>
            </div>

            <h1
              className="ck-fade-up-1"
              style={{
                fontSize: 'clamp(40px, 7vw, 80px)',
                fontWeight: 700,
                lineHeight: 1.07,
                letterSpacing: '-0.03em',
                color: '#1d1d1f',
                margin: 0,
              }}
            >
              Build and deploy on{' '}
              <span style={{ color: '#0071e3' }}>Cloudkit</span>
            </h1>

            <p
              className="ck-fade-up-2"
              style={{
                marginTop: 20,
                marginBottom: 36,
                fontSize: 'clamp(17px, 2vw, 21px)',
                color: '#6e6e73',
                lineHeight: 1.6,
                fontWeight: 400,
                maxWidth: 560,
                margin: '20px auto 36px',
              }}
            >
              Cloudkit automates builds, deployments, HTTPS, and global delivery
              so developers can ship faster with less infrastructure overhead.
            </p>

            <div
              className="ck-fade-up-3"
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <Button onClick={() => navigate('/auth/login')} className="ck-btn-primary h-12">
                Deploy app
              </Button>
            </div>

            <HeroCloud />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '12%',
              right: '12%',
              height: 1,
              background: '#e5e5e7',
            }}
          />
        </section>

        {/* ── MARQUEE ── */}
        <section
          style={{
            padding: '48px 0',
            borderTop: '1px solid #e5e5e7',
            borderBottom: '1px solid #e5e5e7',
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#86868b',
              marginBottom: 24,
            }}
          >
            Develop with your favorite tools
          </p>
          <div className="ck-marquee-mask">
            <div className="ck-marquee">
              {marqueeItems.map((tech, i) => (
                <span
                  key={i}
                  style={{
                    padding: '8px 18px',
                    background: '#ffffff',
                    border: '1px solid #e5e5e7',
                    borderRadius: 999,
                    fontSize: 13,
                    color: '#3a3a3c',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section
          style={{
            padding: 'clamp(60px,10vw,110px) clamp(16px,4vw,24px)',
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#86868b',
                marginBottom: 12,
              }}
            >
              What we offer
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.7rem,4vw,2.6rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: '#1d1d1f',
              }}
            >
              Update your <span className="ck-badge">Apps</span> without
              worrying about <span className="ck-badge">CI/CD</span> pipeline
            </h2>
          </div>

          <div className="ck-features">
            {features.map((f, i) => (
              <div
                key={i}
                className="ck-card ck-fade-up"
                style={{ padding: 28, animationDelay: `${i * 0.06}s` }}
              >
                <div
                  className="ck-icon-dot"
                  style={{ background: `${f.iconBg}1a` }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: f.iconBg,
                      display: 'inline-block',
                    }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 8,
                    letterSpacing: '-0.02em',
                    color: '#1d1d1f',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: '#6e6e73',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <Stats stats={stats} />

        {/* ── BOTTOM CTA ── */}
        <BottomCallToAction />
      </div>
    </>
  );
}