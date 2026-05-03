import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";
import ConfirmModal from "../components/ConfirmModal";
import Lightbox from "../components/Lightbox";
import Confetti from "../components/Confetti";
import { saveDeleted, saveReturned } from "../utils/history";
import { timeAgo } from "../utils/timeAgo";
import { toggleLike, getLikedIds } from "../utils/likedItems";

const FALLBACK = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnfuwM3nVEAX6CTZEiDqyLuvc59VGM5DyN1Q&s";
const PAGE_SIZE = 12;

const STATUS_TABS = [
  ["all",      "Бүгд"],
  ["pending",  "⏳ Хүлээгдэж буй"],
  ["returned", "✅ Буцаасан"],
];

const CATS = [
  { key: "all",     label: "Бүгд",       icon: "🗂️" },
  { key: "phone",   label: "Утас",       icon: "📱" },
  { key: "key",     label: "Түлхүүр",    icon: "🔑" },
  { key: "bag",     label: "Цүнх",       icon: "🎒" },
  { key: "card",    label: "Карт",       icon: "💳" },
  { key: "glasses", label: "Нүдний шил", icon: "👓" },
  { key: "jewelry", label: "Гоёл",       icon: "💍" },
  { key: "other",   label: "Бусад",      icon: "📦" },
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
  const [searchParams] = useSearchParams();
  const [items,    setItems]    = useState([]);
  const [search,   setSearch]   = useState(searchParams.get("q") || "");
  const [status,   setStatus]   = useState("all");
  const [cat,      setCat]      = useState("all");
  const [sort,     setSort]     = useState("newest");
  const [view,     setView]     = useState("grid");
  const [visible,  setVisible]  = useState(PAGE_SIZE);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [confirm,  setConfirm]  = useState({ open: false, id: null, action: null });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const res   = await axios.get("http://localhost:5000/api/items");
      const liked = getLikedIds();
      setItems(res.data.map(i => ({ ...i, liked: liked.has(i._id) })));
    } catch {
      toast.error("Мэдээлэл ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

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
      await axios.delete(`http://localhost:5000/api/items/${id}`);
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
    try { await axios.put(`http://localhost:5000/api/items/${id}`, { status: "returned" }); } catch {}
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

  const filtered = items
    .filter(i => i.type?.toLowerCase() === "found")
    .filter(i => status === "all" || i.status === status)
    .filter(i => cat === "all" || (i.category || inferCat(i.title, i.description)) === cat)
    .filter(i =>
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase()) ||
      i.location?.toLowerCase().includes(search.toLowerCase())
    )
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

      <div className="page-container">
        <div className="page-header">
          <h1>🟢 Олдсон зүйлс</h1>
          <p>Олдсон эд зүйлсийн жагсаалт</p>
        </div>

        <div className="search-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Хайх... (нэр, байршил, тайлбар)"
              value={search}
              onChange={e => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="cat-chips">
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

        <div className="filter-bar">
          <div className="filter-tabs">
            {STATUS_TABS.map(([val, label]) => (
              <button key={val} className={`filter-tab${status === val ? " active" : ""}`}
                onClick={() => { setStatus(val); setVisible(PAGE_SIZE); }}>
                {label}
              </button>
            ))}
          </div>
          <div className="filter-right">
            {!loading && <span className="result-count">{filtered.length} илэрц</span>}
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Шинэ эхлээд</option>
              <option value="oldest">Хуучин эхлээд</option>
              <option value="az">А — Я</option>
            </select>
            <div className="view-toggle">
              <button className={`view-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")} title="Grid харагдац">⊞</button>
              <button className={`view-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")} title="Жагсаалт харагдац">☰</button>
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
            <h3>Илэрц олдсонгүй</h3>
            <p>Хайлтаа өөрчилж үзнэ үү</p>
          </div>
        ) : (
          <>
            <div className={view === "list" ? "item-list" : "item-grid"}>
              {visible_items.map(item => {
                const imgSrc = item.image ? `http://localhost:5000/uploads/${item.image}` : FALLBACK;
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
                      <span className="card-type-badge found">Олдсон</span>
                      {isNew(item.createdAt) && <span className="new-badge">✨ Шинэ</span>}
                    </div>
                    <div className="card-body">
                      <Link to={`/item/${item._id}`} className="card-title">{item.title}</Link>
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
                        {item.status !== "returned" && (
                          <button className="btn-icon returned" onClick={() => openConfirm(item._id, "returned")} title="Эзэндэн хүрсэн">✅</button>
                        )}
                        <button className="btn-icon delete" onClick={() => openConfirm(item._id, "delete")} title="Устгах">🗑</button>
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
