import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { getRecentlyViewed } from "../utils/recentlyViewed";

const FALLBACK = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnfuwM3nVEAX6CTZEiDqyLuvc59VGM5DyN1Q&s";

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
    axios.get("http://localhost:5000/api/items")
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
          <div className="hero-badge">🤖 AI-д суурилсан систем</div>
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
              <span className="hero-search-icon">🔍</span>
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
              <div className="hero-cta-icon">😢</div>
              <div className="hero-cta-text">
                <strong>Зүйлээ хаялаа</strong>
                <span>Хаясан зүйлээ хайх</span>
              </div>
              <div className="hero-cta-arrow">→</div>
            </Link>
            <Link to="/found" className="hero-cta-card found">
              <div className="hero-cta-icon">🎉</div>
              <div className="hero-cta-text">
                <strong>Зүйл олсон</strong>
                <span>Олсон зүйлээ бүртгэх</span>
              </div>
              <div className="hero-cta-arrow">→</div>
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

      {/* ── HOW IT WORKS (iLost inspired) ── */}
      <div className="how-it-works">
        <div className="how-header">
          <div className="how-badge">📋 Хэрхэн ажилладаг вэ?</div>
          <h2>Хялбар <span>3 алхам</span></h2>
          <p>Хаясан эд зүйлээ олоход бид танд туслана</p>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-number">1</div>
            <div className="how-step-icon">📝</div>
            <h3>Бүртгэх</h3>
            <p>Хаясан эсвэл олсон зүйлийнхээ мэдээллийг оруулна</p>
          </div>
          <div className="how-step-line"></div>
          <div className="how-step">
            <div className="how-step-number">2</div>
            <div className="how-step-icon">🤖</div>
            <h3>AI тааруулах</h3>
            <p>AI систем хаясан болон олдсон зүйлсийг автомат тааруулна</p>
          </div>
          <div className="how-step-line"></div>
          <div className="how-step">
            <div className="how-step-number">3</div>
            <div className="how-step-icon">🤝</div>
            <h3>Холбогдох</h3>
            <p>Тохирох зүйл олдвол эзэнтэй нь шууд холбогдоно</p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="features">
        <Link to="/lost" className="feature-card">
          <div className="feature-icon blue">🔍</div>
          <h3>Хайх</h3>
          <p>Хаясан эд зүйлийгээ хурдан хялбараар хайж олоорой</p>
        </Link>
        <Link to="/add" className="feature-card">
          <div className="feature-icon cyan">📦</div>
          <h3>Бүртгэх</h3>
          <p>Олсон эд зүйлийгээ системд бүртгэж эзнийг нь олоорой</p>
        </Link>
        <Link to="/archive" className="feature-card">
          <div className="feature-icon green">✅</div>
          <h3>Архив</h3>
          <p>Эзэндэн хүрсэн болон устгасан зүйлсийн түүхийг харах</p>
        </Link>
      </div>

      {/* ── TRUST SECTION ── */}
      <div className="trust-section">
        <div className="trust-inner">
          <div className="trust-item">
            <div className="trust-icon">🔒</div>
            <div>
              <strong>Аюулгүй</strong>
              <span>Мэдээлэл хамгаалагдсан</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">⚡</div>
            <div>
              <strong>Хурдан</strong>
              <span>Шуурхай хариу өгнө</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">🌐</div>
            <div>
              <strong>24/7</strong>
              <span>Цаг алдалгүй хайх</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">🤖</div>
            <div>
              <strong>AI систем</strong>
              <span>Ухаалаг тааруулалт</span>
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
                  src={item.image ? `http://localhost:5000/uploads/${item.image}` : FALLBACK}
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
