import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='150' y='95' width='100' height='82' rx='8' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='22' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='9' fill='%23d1d5db'/%3E%3Crect x='162' y='103' width='18' height='10' rx='3' fill='%23d1d5db'/%3E%3C/svg%3E";

const CATS = [
  { value: "",        label: "Бүгд",        icon: "🗂️" },
  { value: "phone",   label: "Утас",        icon: "📱" },
  { value: "key",     label: "Түлхүүр",     icon: "🔑" },
  { value: "bag",     label: "Цүнх",        icon: "🎒" },
  { value: "card",    label: "Карт",        icon: "💳" },
  { value: "glasses", label: "Нүдний шил",  icon: "👓" },
  { value: "jewelry", label: "Гоёл",        icon: "💍" },
  { value: "other",   label: "Бусад",       icon: "📦" },
];

function MatchBadge({ score }) {
  const pct = Math.round(score * 100);
  const tier =
    pct >= 70 ? { label: "Өндөр тохирц", cls: "high" } :
    pct >= 40 ? { label: "Дунд тохирц",  cls: "mid"  } :
                { label: "Бага тохирц",  cls: "low"  };
  return (
    <div className={`match-badge match-badge--${tier.cls}`}>
      <span className="match-badge-bar" style={{ width: `${pct}%` }} />
      <span className="match-badge-label">{pct}% · {tier.label}</span>
    </div>
  );
}

function SkeletonResult() {
  return (
    <div className="claim-skeleton">
      <div className="sk sk-img" />
      <div className="claim-skeleton-body">
        <div className="sk sk-title" />
        <div className="sk sk-line" />
        <div className="sk sk-line sk-line--short" />
      </div>
    </div>
  );
}

const IMG_BASE = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function ClaimVerifyModal({ onClose }) {
  const [step,        setStep]     = useState(1);
  const [description, setDesc]     = useState("");
  const [lostDate,    setLostDate] = useState("");
  const [category,    setCat]      = useState("");
  const [loading,     setLoading]  = useState(false);
  const [results,     setResults]  = useState([]);

  const today   = new Date().toISOString().split("T")[0];
  const charMax = 300;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    setStep(2);
    try {
      const res = await API.post("/items/claim-search", { description, lostDate, category });
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="claim-modal">

        {/* ── Banner header ── */}
        <div className="claim-banner">
          <div className="claim-banner-glow" />
          <button className="claim-x" onClick={onClose} aria-label="Хаах">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="claim-banner-inner">
            <div className="claim-banner-icon">🔍</div>
            <div>
              <h2 className="claim-banner-title">Энэ миний зүйл байж магадгүй</h2>
              <p className="claim-banner-sub">Алдсан зүйлийнхээ тайлбараар хайлт хийж тохирох зүйлийг олно уу</p>
            </div>
          </div>

          {/* Step progress */}
          <div className="claim-progress">
            <div className={`claim-prog-step ${step >= 1 ? "done" : ""}`}>
              <div className="claim-prog-dot">
                {step > 1 ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : "1"}
              </div>
              <span>Мэдээлэл</span>
            </div>
            <div className={`claim-prog-line ${step >= 2 ? "done" : ""}`} />
            <div className={`claim-prog-step ${step >= 2 ? "done" : ""}`}>
              <div className="claim-prog-dot">{step > 2 ? "✓" : "2"}</div>
              <span>Үр дүн</span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="claim-body">

          {/* STEP 1 — form */}
          {step === 1 && (
            <form onSubmit={handleSearch} className="claim-form">
              <div className="claim-hint">
                <span className="claim-hint-icon">💡</span>
                <span>Зөвхөн <strong>та л мэдэх</strong> онцлог шинжийг бичнэ үү — өнгө, хэмжээ, загвар, зураас, эвдрэл г.м.</span>
              </div>

              {/* Category chips */}
              <div className="claim-field">
                <label className="claim-label">Ангилал</label>
                <div className="claim-cat-grid">
                  {CATS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`claim-cat-chip ${category === c.value ? "active" : ""}`}
                      onClick={() => setCat(c.value)}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="claim-field">
                <div className="claim-label-row">
                  <label className="claim-label">Алдсан зүйлийн тайлбар <span className="req">*</span></label>
                  <span className={`claim-char ${description.length > charMax * 0.85 ? "warn" : ""}`}>
                    {description.length}/{charMax}
                  </span>
                </div>
                <textarea
                  className="claim-textarea"
                  rows={4}
                  maxLength={charMax}
                  placeholder="Жишээ: Хар өнгийн Samsung Galaxy S21, ар талд цагаан эвдрэлтэй, задгай эрхий дэлгэцтэй..."
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  required
                />
              </div>

              {/* Date */}
              <div className="claim-field">
                <label className="claim-label">Хэзээ алдсан? <span className="claim-optional">(заавал биш)</span></label>
                <input
                  className="claim-date"
                  type="date"
                  max={today}
                  value={lostDate}
                  onChange={e => setLostDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="claim-submit"
                disabled={!description.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Тохирох зүйлс хайх
              </button>
            </form>
          )}

          {/* STEP 2 — results */}
          {step === 2 && (
            <div className="claim-results">
              <div className="claim-results-bar">
                <button className="claim-back" onClick={() => { setStep(1); setResults([]); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Буцах
                </button>
                {!loading && (
                  <span className="claim-count-pill">
                    {results.length > 0
                      ? <>{results.length} тохирох зүйл</>
                      : "Илэрц олдсонгүй"
                    }
                  </span>
                )}
              </div>

              {loading ? (
                <div className="claim-skeleton-list">
                  {[1,2,3].map(i => <SkeletonResult key={i} />)}
                </div>
              ) : results.length === 0 ? (
                <div className="claim-empty">
                  <div className="claim-empty-visual">
                    <span>😔</span>
                  </div>
                  <h3>Тохирох зүйл олдсонгүй</h3>
                  <p>Таны тайлбартай тохирох олдсон зүйл одоогоор бүртгэгдээгүй байна.<br />Өөр үгээр хайж үзнэ үү.</p>
                  <button className="claim-retry" onClick={() => { setStep(1); setResults([]); }}>
                    Дахин хайх
                  </button>
                </div>
              ) : (
                <div className="claim-result-list">
                  {results.map((item, idx) => {
                    const pct = Math.round(item.score * 100);
                    const tier = pct >= 70 ? "high" : pct >= 40 ? "mid" : "low";
                    const imgSrc = item.image ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `${IMG_BASE}/uploads/${item.image}`) : FALLBACK;
                    return (
                      <div key={item._id} className={`claim-card claim-card--${tier}`} style={{ animationDelay: `${idx * 60}ms` }}>
                        <div className="claim-card-rank">{idx + 1}</div>
                        <img
                          src={imgSrc}
                          alt={item.title}
                          className="claim-card-img"
                          onError={e => { e.target.src = FALLBACK; }}
                        />
                        <div className="claim-card-body">
                          <div className="claim-card-top">
                            <span className="claim-card-title">{item.title}</span>
                            <span className={`claim-pct claim-pct--${tier}`}>{pct}%</span>
                          </div>
                          <p className="claim-card-desc">{item.description}</p>
                          <div className="claim-card-meta">
                            {item.location && <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {item.location}</span>}
                            {item.contact && <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 11.5a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 14.87v.05z"/></svg> {item.contact}</span>}
                          </div>
                          <MatchBadge score={item.score} />
                        </div>
                        <Link
                          to={`/item/${item._id}`}
                          className="claim-card-btn"
                          onClick={onClose}
                        >
                          Харах
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
