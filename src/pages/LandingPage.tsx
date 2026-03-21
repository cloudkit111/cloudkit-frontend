"use client";

import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────
   CloudKit Logo
───────────────────────────────────────────── */
function CloudKitLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path d="M30 22a6 6 0 0 0-5.5-5.98A9 9 0 0 0 6 20a6 6 0 0 0 0 12h24a6 6 0 0 0 0-12z" fill="url(#logoGrad)" opacity="0.9" />
      <rect x="15" y="19" width="10" height="7" rx="1.5" fill="#0f172a" opacity="0.7" />
      <rect x="17" y="17" width="6" height="3" rx="1" fill="#0f172a" opacity="0.7" />
      <circle cx="18" cy="23" r="1" fill="url(#logoGrad)" />
      <circle cx="22" cy="23" r="1" fill="url(#logoGrad)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Hero Cloud Symbol
───────────────────────────────────────────── */
function HeroCloud() {
  return (
    <div className="ck-float" style={{ marginTop: "0rem", display: "flex", justifyContent: "center" }}>
      <svg viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ width: "clamp(160px, 30vw, 260px)", height: "auto", filter: "drop-shadow(0 0 60px rgba(96,165,250,0.35))" }}>
        <defs>
          <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(96,165,250,0.9)" />
            <stop offset="50%" stopColor="rgba(167,139,250,0.8)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0.7)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {[8, 4, 0].map((offset, idx) => (
          <path key={idx}
            d={`M${196 - offset} ${130 + offset * 0.5}a${37 - offset} ${37 - offset} 0 0 0-${33 - offset}-${37 - offset}A${57 - offset} ${57 - offset} 0 0 0 ${44 + offset} ${130 + offset * 0.5}a${37 - offset} ${37 - offset} 0 0 0 0 ${74 - offset}h${152 - offset * 2}a${37 - offset} ${37 - offset} 0 0 0 0-${74 - offset}z`}
            fill="none" stroke={`rgba(255,255,255,${0.06 + idx * 0.04})`} strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={`s${i}`}
            d={`M${196 - i * 2.5} ${130 + i * 1.5}a${37 - i * 1.2} ${37 - i * 1.2} 0 0 0-${33 - i * 1}-${37 - i * 1.2}A${57 - i * 1.5} ${57 - i * 1.5} 0 0 0 ${44 + i * 1.5} ${130 + i * 1.5}a${37 - i * 1.2} ${37 - i * 1.2} 0 0 0 0 ${74 - i * 2.5}h${152 - i * 5}a${37 - i * 1.2} ${37 - i * 1.2} 0 0 0 0-${74 - i * 2.5}z`}
            fill="none" stroke={`rgba(255,255,255,${0.5 - i * 0.055})`} strokeWidth="0.8"
            filter={i === 0 ? "url(#glow)" : undefined} />
        ))}
        <path d="M196 130a37 37 0 0 0-33-37A57 57 0 0 0 44 130a37 37 0 0 0 0 74h152a37 37 0 0 0 0-74z"
          fill="url(#cloudGrad1)" opacity="0.12" />
        <path d="M196 130a37 37 0 0 0-33-37A57 57 0 0 0 44 130a37 37 0 0 0 0 74h152a37 37 0 0 0 0-74z"
          fill="none" stroke="url(#cloudGrad1)" strokeWidth="1.5" filter="url(#glow)" />
        <circle cx="82" cy="118" r="2" fill="rgba(96,165,250,0.7)" />
        <circle cx="130" cy="108" r="1.5" fill="rgba(167,139,250,0.7)" />
        <circle cx="178" cy="120" r="2" fill="rgba(239,68,68,0.6)" />
        <circle cx="62" cy="148" r="1.2" fill="rgba(96,165,250,0.4)" />
        <circle cx="200" cy="150" r="1.2" fill="rgba(167,139,250,0.4)" />
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
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const techs = ["Next.js","React","Svelte","Vue","Nuxt","TypeScript","Tailwind","Prisma","tRPC","Drizzle","Bun","Deno","Node.js","Rust","Go","Python"];
  const marqueeItems = [...techs, ...techs];

  const features = [
    { icon: "⚡", iconBg: "rgba(251,191,36,0.15)", title: "Instant Deploy",      desc: "Push to git and your app is live in seconds. Zero configuration needed for most frameworks." },
    { icon: "🌐", iconBg: "rgba(59,130,246,0.15)", title: "Global Edge Network", desc: "CDN spanning 100+ cities worldwide. Sub-50ms latency, everywhere on the planet." },
    { icon: "🔒", iconBg: "rgba(34,197,94,0.15)",  title: "Security First",      desc: "Built-in DDoS protection, WAF, and Bot ID. Automatic HTTPS for every deployment." },
    { icon: "📊", iconBg: "rgba(168,85,247,0.15)", title: "Observability",       desc: "Real-time analytics, logs, and performance monitoring. Understand your app deeply." },
    { icon: "🤖", iconBg: "rgba(239,68,68,0.15)",  title: "AI Gateway",          desc: "Unified gateway for all AI model providers with caching, rate limiting, and analytics." },
    { icon: "🔄", iconBg: "rgba(20,184,166,0.15)", title: "CI/CD Built-in",      desc: "Every PR gets a preview URL. Merge to main, deploy to production. Simple." },
  ];

  const stats = [
    { value: "99.99%", label: "Uptime SLA" },
    { value: "100+",   label: "Edge locations" },
    { value: "< 50ms", label: "Global latency" },
    { value: "10M+",   label: "Deployments" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        html, body { background: #050505 !important; color: #ffffff !important; margin: 0; padding: 0; }
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes pulse1 { 0%,100%{transform:scale(1) translate(0,0);opacity:.8} 50%{transform:scale(1.15) translate(20px,-20px);opacity:1} }
        @keyframes pulse2 { 0%,100%{transform:scale(1) translate(0,0);opacity:.7} 50%{transform:scale(1.1) translate(-15px,15px);opacity:1} }
        @keyframes pulse3 { 0%,100%{transform:scale(1) translate(0,0);opacity:.6} 50%{transform:scale(1.2) translate(10px,-10px);opacity:.9} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .ck-fade-up   { animation: fadeUp .7s ease both; }
        .ck-fade-up-1 { animation: fadeUp .7s .12s ease both; }
        .ck-fade-up-2 { animation: fadeUp .7s .22s ease both; }
        .ck-fade-up-3 { animation: fadeUp .7s .32s ease both; }
        .ck-float     { animation: float 6s ease-in-out infinite; }
        .ck-pulse1    { animation: pulse1 8s ease-in-out infinite; }
        .ck-pulse2    { animation: pulse2 10s ease-in-out infinite; }
        .ck-pulse3    { animation: pulse3 12s ease-in-out infinite; }
        .ck-pulse1r   { animation: pulse1 9s ease-in-out infinite reverse; }
        .ck-marquee   { animation: marquee 22s linear infinite; display:flex; gap:12px; width:max-content; }
        .ck-marquee:hover { animation-play-state: paused; }

        .ck-shimmer {
          background: linear-gradient(90deg,rgba(255,255,255,.4) 0%,#fff 35%,rgba(255,255,255,.4) 60%,#fff 90%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .ck-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
        }

        .ck-marquee-mask {
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
        }

        .ck-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .ck-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.16);
          transform: translateY(-2px);
        }

        .ck-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 22px; background: #ffffff; color: #000000;
          font-size: 14px; font-weight: 600; border-radius: 8px; border: none;
          text-decoration: none; cursor: pointer; font-family: inherit;
          transition: all 0.2s ease; letter-spacing: -0.01em;
        }
        .ck-btn-primary:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(255,255,255,0.15); }

        .ck-btn-outline {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 11px 20px; background: transparent; color: #ffffff;
          font-size: 14px; font-weight: 500; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.16);
          text-decoration: none; cursor: pointer; font-family: inherit;
          transition: all 0.2s ease;
        }
        .ck-btn-outline:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.28); }

        .ck-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 14px; background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.13); border-radius: 999px;
          font-size: 13px; color: rgba(255,255,255,0.85);
        }

        .ck-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.13);
          border-radius: 8px; padding: 2px 10px; font-size: 0.82em;
        }

        .ck-gradient-border { border-radius: 16px; padding: 1px; background: linear-gradient(135deg, rgba(96,165,250,.35), rgba(168,85,247,.35), rgba(239,68,68,.35)); }
        .ck-gradient-inner  { background: #0d0d0d; border-radius: 15px; padding: 32px; }

        /* Responsive grids */
        .ck-features { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .ck-stats    { display: grid; grid-template-columns: repeat(4,1fr); gap: 32px; text-align: center; max-width: 860px; margin: 0 auto; }
        .ck-cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1100px; margin: 0 auto; }

        @media (max-width: 900px) { .ck-features { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 560px) { .ck-features { grid-template-columns: 1fr; } .ck-stats { grid-template-columns: repeat(2,1fr); gap: 24px; } }
        @media (max-width: 768px) { .ck-cta-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* ROOT — inline background guaranteed */}
      <div style={{ minHeight: "100vh", background: "#050505", color: "#ffffff", fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: "hidden" }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(16px,4vw,32px)", height: 60,
          background: scrolled ? "rgba(5,5,5,0.90)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "all 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CloudKitLogo size={28} />
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.03em", color: "#fff" }}>CloudKit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="#" style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "6px 14px" }}>Log In</a>
            <a href="#" className="ck-btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>Sign Up</a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "clamp(100px,14vw,140px) 24px 80px", overflow: "hidden" }}>
          <div className="ck-grid-bg" aria-hidden="true" />

          {/* Glow orbs */}
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div className="ck-pulse1"  style={{ position: "absolute", top: "8%",  left: "12%",  width: "clamp(200px,30vw,420px)", height: "clamp(200px,30vw,420px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)", filter: "blur(40px)" }} />
            <div className="ck-pulse2"  style={{ position: "absolute", top: "4%",  right: "8%",  width: "clamp(180px,28vw,380px)", height: "clamp(180px,28vw,380px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,0.15) 0%,transparent 70%)",   filter: "blur(40px)" }} />
            <div className="ck-pulse3"  style={{ position: "absolute", top: "20%", left: "38%",  width: "clamp(160px,26vw,340px)", height: "clamp(160px,26vw,340px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.12) 0%,transparent 70%)",    filter: "blur(35px)" }} />
            <div className="ck-pulse1r" style={{ position: "absolute", top: "22%", right: "26%", width: "clamp(140px,24vw,300px)", height: "clamp(140px,24vw,300px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.14) 0%,transparent 70%)",  filter: "blur(35px)" }} />
          </div>

          {/* Crosshairs */}
          <div aria-hidden="true" style={{ position:"absolute",top:72,left:"8%",width:20,height:20,borderTop:"1px solid rgba(255,255,255,0.14)",borderLeft:"1px solid rgba(255,255,255,0.14)" }} />
          <div aria-hidden="true" style={{ position:"absolute",top:72,right:"8%",width:20,height:20,borderTop:"1px solid rgba(255,255,255,0.14)",borderRight:"1px solid rgba(255,255,255,0.14)" }} />
          <div aria-hidden="true" style={{ position:"absolute",bottom:36,left:"8%",width:20,height:20,borderBottom:"1px solid rgba(255,255,255,0.14)",borderLeft:"1px solid rgba(255,255,255,0.14)" }} />
          <div aria-hidden="true" style={{ position:"absolute",bottom:36,right:"8%",width:20,height:20,borderBottom:"1px solid rgba(255,255,255,0.14)",borderRight:"1px solid rgba(255,255,255,0.14)" }} />

          {/* Hero content */}
          <div className="-mt-14" style={{ position: "relative", zIndex: 2, maxWidth: 680, width: "100%" }}>
            <div className="ck-fade-up" style={{ marginBottom: 28 }}>
              <span className="ck-chip">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Now in public beta
              </span>
            </div>

            <h1 className="ck-fade-up-1" style={{ fontSize: "clamp(2.2rem,6vw,4rem)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#fff", margin: 0 }}>
              Build and deploy on the{" "}
              <span className="ck-shimmer">CloudKit</span>
            </h1>

            <p className="ck-fade-up-2" style={{ marginTop: 20, marginBottom: 36, fontSize: "clamp(0.95rem,2vw,1.1rem)", color: "rgba(255,255,255,0.48)", lineHeight: 1.72, maxWidth: 460, margin: "20px auto 36px" }}>
              CloudKit provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web.
            </p>

            <div className="ck-fade-up-3" style={{ display: "flex", justifyContent: "center" }}>
              <a href="#" className="ck-btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
                Start Deploying
              </a>
            </div>

            <HeroCloud />
          </div>

          <div style={{ position:"absolute",bottom:0,left:"12%",right:"12%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)" }} />
        </section>

        {/* ── MARQUEE ── */}
        <section style={{ padding: "56px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <p style={{ textAlign:"center",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:28 }}>
            Develop with your favorite tools
          </p>
          <div className="ck-marquee-mask">
            <div className="ck-marquee">
              {marqueeItems.map((tech, i) => (
                <span key={i} style={{ padding:"8px 18px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:999,fontSize:13,color:"rgba(255,255,255,0.6)",whiteSpace:"nowrap",fontWeight:500 }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding:"clamp(60px,10vw,100px) clamp(16px,4vw,24px)",maxWidth:1100,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:60 }}>
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.32)",marginBottom:12 }}>
              What we offer
            </p>
            <h2 style={{ fontSize:"clamp(1.7rem,4vw,2.8rem)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.12,color:"#fff" }}>
              Scale your{" "}
              <span className="ck-badge">🏢 Enterprise</span>
              {" "}without compromising{" "}
              <span className="ck-badge">🛡️ Security</span>
            </h2>
          </div>

          <div className="ck-features">
            {features.map((f, i) => (
              <div key={i} className="ck-card ck-fade-up" style={{ padding:28,animationDelay:`${i*0.08}s` }}>
                <div style={{ width:40,height:40,borderRadius:10,background:f.iconBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize:15,fontWeight:600,marginBottom:8,letterSpacing:"-0.02em",color:"#fff" }}>{f.title}</h3>
                <p style={{ fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.65,margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={{ borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"clamp(40px,8vw,64px) 24px" }}>
          <div className="ck-stats">
            {stats.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize:"clamp(1.6rem,3vw,2.2rem)",fontWeight:700,letterSpacing:"-0.04em",marginBottom:6,color:"#fff" }}>{s.value}</div>
                <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section style={{ padding:"clamp(60px,10vw,100px) clamp(16px,4vw,24px)" }}>
          <div className="ck-cta-grid">
            <div className="ck-gradient-border">
              <div className="ck-gradient-inner">
                <span className="ck-chip">🚀 Ready to deploy?</span>
                <h3 style={{ fontSize:"clamp(1.2rem,2.5vw,1.6rem)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.2,margin:"16px 0 10px",color:"#fff" }}>
                  Start building with a free account.
                </h3>
                <p style={{ fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.65,marginBottom:28 }}>
                  Speak to an expert for your{" "}
                  <span style={{ color:"#60a5fa",fontWeight:500 }}>Pro</span> or{" "}
                  <span style={{ color:"#a78bfa",fontWeight:500 }}>Enterprise</span> needs.
                </p>
                <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                  <a href="#" className="ck-btn-primary">Start Deploying</a>
                  <a href="#" className="ck-btn-outline">Talk to an Expert</a>
                </div>
              </div>
            </div>

            <div className="ck-card" style={{ padding:32 }}>
              <span className="ck-chip">🏢 Enterprise</span>
              <h3 style={{ fontSize:"clamp(1.2rem,2.5vw,1.6rem)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.2,margin:"16px 0 10px",color:"#fff" }}>
                Explore CloudKit Enterprise
              </h3>
              <p style={{ fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.65,marginBottom:28 }}>
                With an interactive product tour, trial, or personalized demo tailored to your team.
              </p>
              <a href="#" className="ck-btn-outline">Explore Enterprise →</a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop:"1px solid rgba(255,255,255,0.06)",padding:"24px 32px",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <p style={{ fontSize:13,color:"rgba(255,255,255,0.3)",letterSpacing:"-0.01em",margin:0 }}>
            © {new Date().getFullYear()} CloudKit. All rights reserved.
          </p>
        </footer>

      </div>
    </>
  );
}