import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const navRef = useRef(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  })();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "");
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  };

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const active = (path) => pathname === path ? "active" : "";
  const close  = () => setMenuOpen(false);

  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="navbar" ref={navRef}>

      <Link to="/home" className="navbar-brand" onClick={close}>
        <div className="brand-icon">🔍</div>
        Lost&amp;Found
      </Link>

      <div className="navbar-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={dark ? "Цайлуур горим" : "Харанхуй горим"}
        >
          {dark ? "☀️" : "🌙"}
        </button>
        <button
          className={`hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Цэс"
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`navbar-links${menuOpen ? " open" : ""}`}>
        <Link to="/home"        className={active("/home") || active("/")} onClick={close}>Нүүр</Link>
        <Link to="/lost"        className={active("/lost")}                onClick={close}>🔴 Хаясан</Link>
        <Link to="/found"       className={active("/found")}               onClick={close}>🟢 Олдсон</Link>
        <Link to="/add"         className={active("/add")}                 onClick={close}>＋ Нэмэх</Link>
        <Link to="/saved"       className={active("/saved")}               onClick={close}>❤️ Хадгалсан</Link>
        <Link to="/archive"     className={active("/archive")}             onClick={close}>📚 Архив</Link>
        <Link to="/leaderboard" className={active("/leaderboard")}         onClick={close}>🏆 Шилдэг</Link>

        {user?.role === "admin" && (
          <Link to="/admin" className={active("/admin")} onClick={close}>⚙️ Admin</Link>
        )}

        {user ? (
          <>
            <div className="nav-avatar" title={user.name || user.email}>
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <button onClick={() => { close(); logout(); }} className="btn btn-outline nav-logout">
              Гарах
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-login" onClick={close}>Нэвтрэх</Link>
        )}
      </div>

    </nav>
  );
}

export default Navbar;
