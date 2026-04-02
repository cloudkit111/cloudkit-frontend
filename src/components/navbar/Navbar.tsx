import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "../../assets/cloudkit.png";

type NavUser = {
  fullname?: string;
  email?: string;
  avatar_url?: string;
  username?: string;
};

type NavbarProps = {
  variant: "guest" | "auth";
  user?: NavUser | null;
  onLogout?: () => void;
  scrolled?: boolean;
};

export default function Navbar({
  variant,
  user,
  onLogout,
  scrolled,
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initials =
    user?.fullname
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

  return (
    <>
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-dropIn { animation: dropIn 0.15s ease; }

        .ck-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: #ffffff;
          color: #000000;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }
        .ck-btn-primary:hover {
          background: rgba(255,255,255,0.9);
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(255,255,255,0.15);
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(16px, 4vw, 32px)",
          background: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "all 0.3s ease",
        }}
        onClick={() => showUserMenu && setShowUserMenu(false)}
      >
        {/* Left: Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <img
            src={logo}
            width={28}
            height={28}
            alt="CloudKit"
            style={{ objectFit: "contain" }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            cloudKit
          </span>
        </Link>

        {/* Right: guest vs auth */}
        {variant === "guest" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              to="/login"
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                padding: "6px 14px",
              }}
            >
              Log In
            </Link>
            <Link to="/signup" className="ck-btn-primary">
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid transparent",
                background: "transparent",
                color: "#ededed",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#1a1a1a";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#2a2a2a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "transparent";
              }}
              onClick={() => setShowUserMenu((v) => !v)}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#fff",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={initials}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              {/* Name + email */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.3,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: "#ededed" }}
                >
                  {user?.fullname ?? "…"}
                </span>
                <span style={{ fontSize: 11, color: "#666" }}>
                  {user?.email ?? ""}
                </span>
              </div>

              {/* Chevron */}
              <span
                style={{
                  fontSize: 10,
                  color: "#555",
                  display: "inline-block",
                  transition: "transform 0.2s ease",
                  transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div
                className="animate-dropIn"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  minWidth: 200,
                  background: "#111",
                  border: "1px solid #222",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  zIndex: 200,
                }}
              >
                {/* User info header */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #1e1e1e",
                  }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 500, color: "#ededed" }}
                  >
                    {user?.fullname}
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                    {user?.email}
                  </div>
                </div>

                {/* Projects */}
                <Link to="/my-project" style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#aaa",
                      cursor: "pointer",
                      transition: "all 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "#1a1a1a";
                      (e.currentTarget as HTMLDivElement).style.color =
                        "#ededed";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLDivElement).style.color = "#aaa";
                    }}
                  >
                    <span style={{ fontSize: 14 }}>📁</span> Projects
                  </div>
                </Link>

                {/* Logout */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#f87171",
                    cursor: "pointer",
                    borderTop: "1px solid #1e1e1e",
                    transition: "all 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(248,113,113,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                  }}
                  onClick={onLogout}
                >
                  <span style={{ fontSize: 14 }}>↩</span> Log out
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
