import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { getRecentlyViewed } from "../utils/recentlyViewed";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='150' y='95' width='100' height='82' rx='8' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='22' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='9' fill='%23d1d5db'/%3E%3Crect x='162' y='103' width='18' height='10' rx='3' fill='%23d1d5db'/%3E%3C/svg%3E";
const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", "");

function StatItem({ target, suffix = "", label }) {
  const [count, setCount] = useState(0);
  const ref     = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration  = 1400;
        const startTime = performance.now();
        const tick = (now) => {
          const p     = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCount(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div className="stat-item" ref={ref}>
      <strong>{count.toLocaleString()}{suffix}</strong>
      <span>{label}</span>
    </div>
  );
}

function Home() {
  const [heroSearch, setHeroSearch] = useState("");
  const [stats,      setStats]      = useState({ total: 0, returned: 0, lost: 0, found: 0 });
  const [recent,     setRecent]     = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/items`)
      .then(res => {
        const d = res.data;
        setStats({
          total:    d.length,
          returned: d.filter(i => i.status === "returned").length,
          lost:     d.filter(i => i.type === "lost").length,
          found:    d.filter(i => i.type === "found").length,
        });
      })
      .catch(() => setStats({ total: 500, returned: 87, lost: 320, found: 180 }));

    setRecent(getRecentlyViewed());
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = heroSearch.trim();
    navigate(q ? `/lost?q=${encodeURIComponent(q)}` : "/lost");
  };

  return (
    <div>
      <Navbar />

      {/* ── HERO (iLost inspired) ── */}
      <div className="hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
        </div>

        <div className="hero-content">
          <h1>
            Lost &amp; Found зүйлсийг<br />
            <span>эзэнтэй нь</span> холбоно
          </h1>
          <p>
            Хаясан болон олсон эд зүйлсийг бүртгэж, AI технологийн тусламжтайгаар
            эзнийг нь хурдан олоход туслана.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <div className="hero-search-wrap">
              <span className="hero-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input
                placeholder="Хайж буй зүйлийнхээ нэрийг бичнэ үү..."
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
              />
              <button type="submit" className="hero-search-btn">Хайх</button>
            </div>
          </form>

          <div className="hero-cta-group">
            <Link to="/lost" className="hero-cta-card lost">
              <div className="hero-cta-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </div>
              <div className="hero-cta-text">
                <strong>Зүйлээ хаялаа</strong>
                <span>Хаясан зүйлээ хайх</span>
              </div>
              <div className="hero-cta-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </Link>
            <Link to="/found" className="hero-cta-card found">
              <div className="hero-cta-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <polyline points="9 11 11 13 15 9"/>
                </svg>
              </div>
              <div className="hero-cta-text">
                <strong>Зүйл олсон</strong>
                <span>Олсон зүйлээ бүртгэх</span>
              </div>
              <div className="hero-cta-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── ANIMATED STATS ── */}
      <div className="stats">
        <StatItem target={stats.total}    suffix="+"  label="Нийт бүртгэл" />
        <StatItem target={stats.returned} suffix=""   label="Эзэндэн хүрсэн" />
        <StatItem target={stats.lost}     suffix=""   label="Хаясан зүйлс" />
        <StatItem target={stats.found}    suffix=""   label="Олдсон зүйлс" />
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="how-it-works">
        <div className="how-header">
          <div className="how-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Хэрхэн ажилладаг вэ?
          </div>
          <h2>Хялбар <span>3 алхам</span></h2>
          <p>Хаясан эд зүйлээ олоход бид танд туслана</p>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-number">1</div>
            <div className="how-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <h3>Бүртгэх</h3>
            <p>Хаясан эсвэл олсон зүйлийнхээ мэдээллийг оруулна</p>
          </div>
          <div className="how-step-line"></div>
          <div className="how-step">
            <div className="how-step-number">2</div>
            <div className="how-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h3>Хайх</h3>
            <p>Системд бүртгэгдсэн зүйлсийг хайж харьцуулна</p>
          </div>
          <div className="how-step-line"></div>
          <div className="how-step">
            <div className="how-step-number">3</div>
            <div className="how-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Холбогдох</h3>
            <p>Тохирох зүйл олдвол эзэнтэй нь шууд холбогдоно</p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="features">
        <Link to="/lost" className="feature-card">
          <div className="feature-icon blue">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h3>Хайх</h3>
          <p>Хаясан эд зүйлийгээ хурдан хялбараар хайж олоорой</p>
        </Link>
        <Link to="/add" className="feature-card">
          <div className="feature-icon cyan">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <h3>Бүртгэх</h3>
          <p>Олсон эд зүйлийгээ системд бүртгэж эзнийг нь олоорой</p>
        </Link>
        <Link to="/archive" className="feature-card">
          <div className="feature-icon green">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3>Архив</h3>
          <p>Эзэндэн хүрсэн болон устгасан зүйлсийн түүхийг харах</p>
        </Link>
      </div>

      {/* ── TRUST SECTION ── */}
      <div className="trust-section">
        <div className="trust-inner">
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <strong>Аюулгүй</strong>
              <span>Мэдээлэл хамгаалагдсан</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <strong>Хурдан</strong>
              <span>Шуурхай хариу өгнө</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Цаг алдалгүй хайх</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENTLY VIEWED ── */}
      {recent.length > 0 && (
        <div className="recent-section">
          <div className="recent-header">
            <h3>🕐 Сүүлд үзсэн</h3>
            <span className="recent-sub">Таны хайсан зүйлс</span>
          </div>
          <div className="recent-list">
            {recent.map(item => (
              <Link to={`/item/${item._id}`} key={item._id} className="recent-item">
                <img
                  src={item.image ? (item.image.startsWith("http") ? item.image : `${BASE_URL}/uploads/${item.image}`) : FALLBACK}
                  alt={item.title}
                  onError={e => { e.target.src = FALLBACK; }}
                />
                <div className="recent-info">
                  <span className="recent-title">{item.title}</span>
                  <span className="recent-loc">📍 {item.location || "—"}</span>
                  <span className={`card-type-badge ${item.type}`} style={{ position: "static", fontSize: 10, padding: "2px 7px" }}>
                    {item.type === "found" ? "Олдсон" : "Хаясан"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
