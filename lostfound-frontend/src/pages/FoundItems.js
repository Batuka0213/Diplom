import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import socket from "../socket";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";
import ConfirmModal from "../components/ConfirmModal";
import Lightbox from "../components/Lightbox";
import Confetti from "../components/Confetti";
import ClaimVerifyModal from "../components/ClaimVerifyModal";
import ClaimSubmitModal from "../components/ClaimSubmitModal";
import ClaimStatusModal from "../components/ClaimStatusModal";
import { saveDeleted, saveReturned } from "../utils/history";
import { timeAgo } from "../utils/timeAgo";
import { toggleLike, getLikedIds } from "../utils/likedItems";
import { useLang } from "../contexts/LangContext";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='150' y='95' width='100' height='82' rx='8' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='22' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='9' fill='%23d1d5db'/%3E%3Crect x='162' y='103' width='18' height='10' rx='3' fill='%23d1d5db'/%3E%3C/svg%3E";
const PAGE_SIZE = 12;
const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", "");

const CAT_KEYS = [
  { key: "all",     icon: "🗂️" },
  { key: "phone",   icon: "📱" },
  { key: "key",     icon: "🔑" },
  { key: "bag",     icon: "🎒" },
  { key: "card",    icon: "💳" },
  { key: "glasses", icon: "👓" },
  { key: "jewelry", icon: "💍" },
  { key: "other",   icon: "📦" },
];

const inferCat = (title = "", desc = "") => {
  const t = (title + " " + desc).toLowerCase();
  if (/утас|phone|samsung|iphone|xiaomi|huawei|oppo|nokia|андройд/.test(t)) return "phone";
  if (/түлхүүр|key|замок|ключ/.test(t))                                      return "key";
  if (/цүнх|bag|backpack|сумка|рюкзак|уут/.test(t))                          return "bag";
  if (/карт|card|данс|visa|bank/.test(t))                                     return "card";
  if (/нүдний шил|glasses|очки|линз/.test(t))                                return "glasses";
  if (/гоёл|алт|мөнгө|бугуйвч|цаг|watch|ring|бөгж/.test(t))                 return "jewelry";
  return "other";
};

const isNew   = (d) => d && Date.now() - new Date(d).getTime() < 86_400_000;
const copyTel = (n) => {
  navigator.clipboard.writeText(n).catch(() => {});
  toast.success(`${n} — хуулагдлаа 📋`, { duration: 1500 });
};

function FoundItems() {
  const { t } = useLang();
  const foundT = t("found");
  const catsT  = t("cats");
  const CATS = CAT_KEYS.map(c => ({ ...c, label: catsT[c.key] || c.key }));
  const STATUS_TABS = [
    ["all",      foundT.all],
    ["pending",  `⏳ ${foundT.pending}`],
    ["returned", `✅ ${foundT.returned}`],
  ];

  const [searchParams] = useSearchParams();
  const [items,    setItems]    = useState([]);
  const [search,   setSearch]   = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
  const [status,   setStatus]   = useState("all");
  const [cat,      setCat]      = useState("all");
  const [sort,     setSort]     = useState("newest");
  const [view,     setView]     = useState("grid");
  const [visible,  setVisible]  = useState(PAGE_SIZE);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [confirm,  setConfirm]  = useState({ open: false, id: null, action: null });
  const [showClaim,       setShowClaim]       = useState(false);
  const [showClaimStatus, setShowClaimStatus] = useState(false);
  const [claimTargetItem, setClaimTargetItem] = useState(null);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const isAdmin = currentUser?.role === "admin";

  // Debounce search input — 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Server-side fetch when debounced search or status changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type: "found" });
        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
        if (status !== "all")       params.set("status", status);

        const res   = await axios.get(`${API_URL}/items?${params}`);
        if (cancelled) return;
        const liked = getLikedIds();
        setItems(res.data.map(i => ({ ...i, liked: liked.has(i._id) })));
        setVisible(PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error("Мэдээлэл ачаалахад алдаа гарлаа");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSearch, status]);

  // Real-time: шинэ зүйл бүртгэгдэхэд автоматаар нэмэх
  useEffect(() => {
    const handler = (item) => {
      if (item.type !== "found") return;
      const liked = getLikedIds();
      setItems(prev => {
        if (prev.find(i => i._id === item._id)) return prev;
        return [{ ...item, liked: liked.has(item._id) }, ...prev];
      });
      setVisible(v => v + 1);
    };
    socket.on("new_item", handler);
    return () => socket.off("new_item", handler);
  }, []);

  const openConfirm  = (id, action) => setConfirm({ open: true, id, action });
  const closeConfirm = () => setConfirm({ open: false, id: null, action: null });

  const handleConfirm = () => {
    if (confirm.action === "delete")   doDelete(confirm.id);
    if (confirm.action === "returned") doReturn(confirm.id);
    closeConfirm();
  };

  const doDelete = async (id) => {
    const item = items.find(i => i._id === id);
    const tid  = toast.loading("Устгаж байна...");
    try {
      await axios.delete(`${API_URL}/items/${id}`);
      if (item) saveDeleted(item);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success("Устгагдлаа — Архивд хадгалагдлаа 📚", { id: tid });
    } catch {
      toast.error("Устгахад алдаа гарлаа", { id: tid });
    }
  };

  const doReturn = async (id) => {
    const item = items.find(i => i._id === id);
    const tid  = toast.loading("Тэмдэглэж байна...");
    if (item) saveReturned(item);
    try { await axios.put(`${API_URL}/items/${id}/status`, { status: "returned" }); } catch {}
    setItems(prev => prev.map(i => i._id === id ? { ...i, status: "returned" } : i));
    toast.success("✅ Эзэндэн хүрсэн! Архивд нэмэгдлээ 📚", { id: tid });
    setConfetti(true);
  };

  const likeItem = (id) => {
    const item = items.find(i => i._id === id);
    if (!item) return;
    const nowLiked = toggleLike(item);
    setItems(prev => prev.map(i => i._id === id ? { ...i, liked: nowLiked } : i));
    toast(nowLiked ? "❤️ Хадгалагдлаа" : "Хадгалсанаас хасагдлаа", { duration: 1300 });
  };

  // Client-side: category filter + sort
  const filtered = items
    .filter(i => cat === "all" || (i.category || inferCat(i.title, i.description)) === cat)
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "az")     return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

  const visible_items = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const confirmItem = items.find(i => i._id === confirm.id);

  return (
    <div>
      <Navbar />

      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      {lightbox && <Lightbox src={lightbox} alt="Зураг" onClose={() => setLightbox(null)} />}

      <ConfirmModal
        isOpen={confirm.open}
        danger={confirm.action === "delete"}
        message={
          confirm.action === "delete"
            ? `"${confirmItem?.title}" устгах уу?`
            : `"${confirmItem?.title}" эзэндэн хүрсэн гэж тэмдэглэх үү?`
        }
        subMessage={confirm.action === "delete" ? "Архивд хадгалагдана." : undefined}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      {showClaim       && <ClaimVerifyModal onClose={() => setShowClaim(false)} />}
      {showClaimStatus && <ClaimStatusModal onClose={() => setShowClaimStatus(false)} />}
      {claimTargetItem && (
        <ClaimSubmitModal item={claimTargetItem} onClose={() => setClaimTargetItem(null)} />
      )}

      <div className="page-container">
        <div className="page-header-block">

          {/* Title + claim button */}
          <div className="page-header">
            <h1>🟢 {foundT.title}</h1>
            <button className="btn-claim-trigger btn-status-trigger" onClick={() => setShowClaimStatus(true)}>
              <span className="claim-trigger-icon">📋</span>
              <span>{foundT.claimStatus}</span>
            </button>
          </div>

          {/* Search */}
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                placeholder={foundT.searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="search-clear"
                  onClick={() => setSearch("")}
                  title="Цэвэрлэх"
                  aria-label="Хайлт цэвэрлэх"
                >✕</button>
              )}
            </div>
          </div>

          {/* Category chips */}
          <div className="cat-chips" style={{ marginBottom: 0 }}>
            {CATS.map(c => (
              <button
                key={c.key}
                className={`cat-chip${cat === c.key ? " active" : ""}`}
                onClick={() => { setCat(c.key); setVisible(PAGE_SIZE); }}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>

          {/* Filter + sort */}
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="filter-tabs">
              {STATUS_TABS.map(([val, label]) => (
                <button key={val} className={`filter-tab${status === val ? " active" : ""}`}
                  onClick={() => setStatus(val)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="filter-right">
              {!loading && <span className="result-count">{filtered.length} илэрц</span>}
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">{t("sort").newest}</option>
                <option value="oldest">{t("sort").oldest}</option>
                <option value="az">{t("sort").az}</option>
              </select>
              <div className="view-toggle">
                <button className={`view-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")} title="Grid харагдац">⊞</button>
                <button className={`view-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")} title="Жагсаалт харагдац">☰</button>
              </div>
            </div>
          </div>

        </div>

        {loading ? (
          <div className="item-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>{foundT.noItems}</h3>
          </div>
        ) : (
          <>
            <div className={view === "list" ? "item-list" : "item-grid"}>
              {visible_items.map(item => {
                const imgSrc = item.image ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `${BASE_URL}/uploads/${item.image}`) : FALLBACK;
                return (
                  <div className={view === "list" ? "item-row" : "item-card"} key={item._id}>
                    <div className="card-img-wrap">
                      <img
                        src={imgSrc}
                        className={view === "list" ? "row-img clickable-img" : "card-img clickable-img"}
                        alt={item.title}
                        onError={e => { e.target.src = FALLBACK; }}
                        onClick={() => setLightbox(imgSrc)}
                        title="Дарж томруулж харах"
                      />
                      <span className="card-type-badge found">{t("item").found}</span>
                      {isNew(item.createdAt) && <span className="new-badge">✨ Шинэ</span>}
                    </div>
                    <div className="card-body">
                      <Link to={`/item/${item._id}`} state={{ item }} className="card-title">{item.title}</Link>
                      <p className="card-desc">{item.description}</p>
                      <div className="card-meta">
                        <span>📍 {item.location || "—"}</span>
                        <span>🕐 {timeAgo(item.createdAt)}</span>
                        <span className="copyable" onClick={() => copyTel(item.contact || "86788622")} title="Дарж хуулах">
                          📞 {item.contact || "86788622"} 📋
                        </span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <span className={`status-badge ${item.status || "pending"}`}>{item.status || "pending"}</span>
                      <div className="card-actions">
                        <button className={`btn-icon${item.liked ? " liked" : ""}`} onClick={() => likeItem(item._id)} title="Хадгалах">
                          {item.liked ? "❤️" : "🤍"}
                        </button>
                        {/* Хэн ч: эзэмшлийн хүсэлт гаргах */}
                        {item.status !== "returned" && (
                          <button
                            className="btn-icon"
                            style={{ fontSize: 13, padding: "4px 8px", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 6 }}
                            onClick={() => setClaimTargetItem(item)}
                            title={foundT.claim}
                          >🔐 {foundT.claim}</button>
                        )}
                        {/* Зөвхөн admin: буцаасан тэмдэглэх, устгах */}
                        {isAdmin && item.status !== "returned" && (
                          <button className="btn-icon returned" onClick={() => openConfirm(item._id, "returned")} title="Эзэндэн хүрсэн">✅</button>
                        )}
                        {isAdmin && (
                          <button className="btn-icon delete" onClick={() => openConfirm(item._id, "delete")} title="Устгах">🗑</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="load-more-wrap">
                <button className="btn-load-more" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                  Дахин {Math.min(PAGE_SIZE, filtered.length - visible)} зүйл харах
                  <span className="load-more-count">{filtered.length - visible} үлдсэн</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FoundItems;
