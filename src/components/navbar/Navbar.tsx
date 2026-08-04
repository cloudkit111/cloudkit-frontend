import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import "../CardNav.css"
import CloudKitLogo from "../../assets/cloudkit-new.png"
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavUser = {
  fullname?: string;
  email?: string;
  avatar_url?: string;
  username?: string;
};

export type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
  /** Optional handler for actions that aren't real navigation (e.g. logout) */
  onClick?: () => void;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface NavbarProps {
  /** Guest = logged out, Auth = logged in */
  variant: 'guest' | 'auth';
  user?: NavUser | null;
  onLogout?: () => void;
  /** Toggles the compact/blurred top-bar look once the page has scrolled */
  scrolled?: boolean;
  logo?: string;
  logoAlt?: string;
  /** Optional extra nav cards (e.g. Product, Docs). Rendered before the account card. */
  items?: CardNavItem[];
  ease?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Navbar: React.FC<NavbarProps> = ({
  variant,
  user,
  onLogout,
  scrolled = false,
  logo,
  logoAlt = 'Logo',
  items = [],
  ease = 'power3.out',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const initials =
    user?.fullname
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??';

  // The final card is always an "account" card driven by variant/user state.
  const accountCard: CardNavItem = useMemo(() => {
    if (variant === 'auth') {
      return {
        label: user?.fullname || 'Account',
        bgColor: '#f5f5f7',
        textColor: '#1d1d1f',
        links: [
          { label: 'Projects', href: '/projects', ariaLabel: 'View your projects' },
          {
            label: 'Log Out',
            href: '#',
            ariaLabel: 'Log out of your account',
            onClick: onLogout,
          },
        ],
      };
    }
    return {
      label: 'Account',
      bgColor: '#f5f5f7',
      textColor: '#1d1d1f',
      links: [
        { label: 'Log In', href: '/auth/login', ariaLabel: 'Log in to your account' },
        { label: 'Sign Up', href: '/auth/signup', ariaLabel: 'Create a new account' },
      ],
    };
  }, [variant, user, onLogout]);

  const cards = useMemo(() => [...items, accountCard], [items, accountCard]);

  // ---------------------------------------------------------------------
  // Height calculation + GSAP timeline (same mechanics as CardNav)
  // ---------------------------------------------------------------------

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.navbar-content') as HTMLElement;
      if (contentEl) {
        const wasVisibility = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisibility;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, cards.length]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsExpanded(true);
      tl.play(0);
    } else {
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const closeMenu = () => {
    const tl = tlRef.current;
    if (!tl || !isExpanded) return;
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
    tl.reverse();
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const handleLinkClick = (e: React.MouseEvent, link: CardNavLink) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
    closeMenu();
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <div className="navbar-container">
      <nav
        ref={navRef}
        className={`navbar ${isExpanded ? 'open' : ''} ${scrolled && !isExpanded ? 'scrolled' : ''}`}
      >
        <div className="navbar-top">
          <div
            className={`hamburger-menu ${isExpanded ? 'open' : ''}`}
            onClick={toggleMenu}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
              }
            }}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            tabIndex={0}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <Link to="/" className="logo-container" aria-label="Go to homepage">
            <img src={CloudKitLogo} alt={logoAlt} className="logo" draggable={false} />
            <span className="logo-text">Cloudkit</span>
          </Link>

          {variant === 'guest' ? (
            <Button type="button" className="navbar-cta-button h-10" onClick={toggleMenu}>
              Get Started
            </Button>
          ) : (
            <button
              type="button"
              className="navbar-account-trigger"
              onClick={toggleMenu}
              aria-label="Open account menu"
              aria-expanded={isExpanded}
            >
              <span className="navbar-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={initials} />
                ) : (
                  initials
                )}
              </span>
              <span className="navbar-account-name">{user?.fullname ?? '…'}</span>
              <span className={`navbar-chevron ${isExpanded ? 'open' : ''}`}>▾</span>
            </button>
          )}
        </div>

        <div className="navbar-content" aria-hidden={!isExpanded}>
          {cards.map((item, idx) => {
            const isAccountCard = idx === cards.length - 1;
            return (
              <div
                key={`${item.label}-${idx}`}
                className={`nav-card ${isAccountCard ? 'nav-card-account' : ''}`}
                ref={setCardRef(idx)}
                style={{ backgroundColor: item.bgColor, color: item.textColor }}
              >
                {isAccountCard && variant === 'auth' && (
                  <div className="nav-card-account-header">
                    <span className="navbar-avatar navbar-avatar-lg">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={initials} />
                      ) : (
                        initials
                      )}
                    </span>
                    <div className="nav-card-account-meta">
                      <span className="nav-card-account-fullname">{user?.fullname}</span>
                      <span className="nav-card-account-email">{user?.email}</span>
                    </div>
                  </div>
                )}

                <div className="nav-card-label">{item.label}</div>

                <div className="nav-card-links">
                  {item.links?.map((lnk, i) => (
                    <Link
                      key={`${lnk.label}-${i}`}
                      className={`nav-card-link ${lnk.label === 'Log Out' ? 'nav-card-link-danger' : ''}`}
                      to={lnk.href}
                      aria-label={lnk.ariaLabel}
                      onClick={(e) => handleLinkClick(e, lnk)}
                    >
                      <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                      {lnk.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;