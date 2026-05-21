import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../contexts/LangContext";
import { LANGS } from "../i18n";

const IC = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  lost: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  found: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <polyline points="9 11 11 13 15 9"/>
    </svg>
  ),
  add: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  saved: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  archive: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  ),
  trophy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4H4a2 2 0 0 0-2 2v1a5 5 0 0 0 5 5"/><path d="M17 4h3a2 2 0 0 1 2 2v1a5 5 0 0 1-5 5"/>
      <path d="M7 4a5 5 0 0 0 5 5 5 5 0 0 0 5-5H7z"/>
    </svg>
  ),
  admin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 0 14.14 14.14"/>
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  sun: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
};

function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { lang, t, changeLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [dark, setDark]         = useState(() => localStorage.getItem("theme") === "dark");
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const langRef = useRef(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  })();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/home") return pathname === "/" || pathname === "/home";
    return pathname === path;
  };
  const close = () => setMenuOpen(false);

  const initials = user
    ? (user.name || user.email || "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "";

  const nav = t("nav");
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  const NAV_LINKS = [
    { to: "/home",        label: nav.home,        icon: IC.home    },
    { to: "/lost",        label: nav.lost,        icon: IC.lost,   dot: "lost"  },
    { to: "/found",       label: nav.found,       icon: IC.found,  dot: "found" },
    { to: "/saved",       label: nav.saved,       icon: IC.saved   },
    { to: "/archive",     label: nav.archive,     icon: IC.archive },
    { to: "/leaderboard", label: nav.leaderboard, icon: IC.trophy  },
  ];

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`} ref={navRef}>

      <Link to="/home" className="nav-brand" onClick={close}>
        <span className="nav-brand-mark" />
        Lost&amp;Found
      </Link>

      <div className="nav-center">
        {NAV_LINKS.map(({ to, label, icon, dot }) => (
          <Link
            key={to}
            to={to}
            className={`nav-link${isActive(to) ? " active" : ""}${dot ? ` nl-${dot}` : ""}`}
            onClick={close}
          >
            {dot && <span className={`nav-dot ${dot}`} />}
            {!dot && icon}
            {label}
          </Link>
        ))}

        {user?.role === "admin" && (
          <Link to="/admin" className={`nav-link${isActive("/admin") ? " active" : ""}`} onClick={close}>
            {IC.admin} Admin
          </Link>
        )}
      </div>

      <div className="nav-right">
        {user && (
          <Link to="/add" className="nav-add-btn" onClick={close}>
            {IC.add} {nav.addItem}
          </Link>
        )}

        <button className="nav-theme-btn" onClick={toggleTheme} title={dark ? "Цайлуур" : "Харанхуй"}>
          {dark ? IC.sun : IC.moon}
        </button>

        {/* Language selector */}
        <div className="nav-lang-wrap" ref={langRef}>
          <button
            className="nav-lang-btn"
            onClick={() => setLangOpen(o => !o)}
            title="Хэл сонгох"
          >
            <span className="nav-lang-flag">{currentLang.flag}</span>
            <span className="nav-lang-code">{currentLang.code.toUpperCase()}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {langOpen && (
            <div className="nav-lang-menu">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  className={`nav-lang-option${l.code === lang ? " active" : ""}`}
                  onClick={() => { changeLang(l.code); setLangOpen(false); }}
                >
                  <span className="nav-lang-flag">{l.flag}</span>
                  <span>{l.label}</span>
                  {l.code === lang && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <div className="nav-user-wrap">
            <div className="nav-avatar" title={user.name || user.email}>
              {user.picture
                ? <img src={user.picture} alt={initials} className="nav-avatar-img" referrerPolicy="no-referrer" />
                : <span className="nav-avatar-text">{initials}</span>
              }
            </div>
            <button className="nav-logout-btn" onClick={() => { close(); logout(); }} title={nav.logout}>
              {IC.logout}
            </button>
          </div>
        ) : (
          <Link to="/login" className="nav-login-btn" onClick={close}>{nav.login}</Link>
        )}

        <button
          className={`nav-hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Цэс"
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-link${isActive(to) ? " active" : ""}`}
              onClick={close}
            >
              {icon} {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link to="/admin" className={`mobile-link${isActive("/admin") ? " active" : ""}`} onClick={close}>
              {IC.admin} Admin
            </Link>
          )}
          {user && (
            <Link to="/add" className="mobile-link mobile-add" onClick={close}>
              {IC.add} {nav.addItem}
            </Link>
          )}
          <div className="mobile-divider" />
          <div className="mobile-lang-row">
            {LANGS.map(l => (
              <button
                key={l.code}
                className={`mobile-lang-btn${l.code === lang ? " active" : ""}`}
                onClick={() => { changeLang(l.code); close(); }}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <div className="mobile-divider" />
          {user ? (
            <button className="mobile-logout" onClick={() => { close(); logout(); }}>
              {IC.logout} {nav.logout}
            </button>
          ) : (
            <Link to="/login" className="mobile-login" onClick={close}>{nav.login}</Link>
          )}
        </div>
      )}

    </nav>
  );
}

export default Navbar;
