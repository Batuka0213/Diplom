import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { getDeleted, clearDeleted, getReturned } from "../utils/history";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='150' y='95' width='100' height='82' rx='8' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='22' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='9' fill='%23d1d5db'/%3E%3Crect x='162' y='103' width='18' height='10' rx='3' fill='%23d1d5db'/%3E%3C/svg%3E";
const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", "");

function ItemCard({ item, tab }) {
  const contact = item.contact || "86788622";

  const copyContact = () => {
    navigator.clipboard.writeText(contact).catch(() => {});
    toast.success(`${contact} — хуулагдлаа 📋`, { duration: 1500 });
  };

  return (
    <div className="item-card">
      <div className="card-img-wrap">
        <img
          src={item.image ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `${BASE_URL}/uploads/${item.image}`) : FALLBACK}
          className="card-img"
          alt={item.title}
          onError={e => { e.target.src = FALLBACK; }}
        />
        <span className={`card-type-badge ${item.type || "lost"}`}>
          {item.type === "found" ? "Олдсон" : "Хаясан"}
        </span>
      </div>

      <div className="card-body">
        {tab === "returned" && item._id ? (
          <Link to={`/item/${item._id}`} className="card-title">{item.title}</Link>
        ) : (
          <span className="card-title" style={{ cursor: "default" }}>{item.title}</span>
        )}
        <p className="card-desc">{item.description || "—"}</p>
        <div className="card-meta">
          <span>📍 {item.location || "—"}</span>
          <span
            className="copyable"
            onClick={copyContact}
            title="Дарж хуулах"
          >
            📞 {contact} 📋
          </span>
        </div>
      </div>

      <div className="card-footer">
        {tab === "returned" ? (
          <div className="archive-time-row">
            <span className="status-badge returned">✅ Эзэндэн хүрсэн</span>
            {item.returnedAt && (
              <span className="archive-date">
                {new Date(item.returnedAt).toLocaleDateString("mn-MN")}
              </span>
            )}
          </div>
        ) : (
          <div className="archive-time-row">
            <span className="status-badge" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
              🗑 Устгасан
            </span>
            {item.deletedAt && (
              <span className="archive-date">
                {new Date(item.deletedAt).toLocaleDateString("mn-MN")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Archive() {
  const [tab,          setTab]          = useState("returned");
  const [apiReturned,  setApiReturned]  = useState([]);
  const [localReturned, setLocalReturned] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    // 1. Load from API
    axios.get(`${API_URL}/items`)
      .then(res => setApiReturned(res.data.filter(i => i.status === "returned")))
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Load from localStorage
    setLocalReturned(getReturned());
    setDeletedItems(getDeleted());
  }, []);

  // Merge API + localStorage returned items (deduplicated by _id)
  const returnedItems = useMemo(() => {
    const apiIds = new Set(apiReturned.map(i => i._id));
    return [
      ...apiReturned,
      ...localReturned.filter(i => !apiIds.has(i._id)),
    ];
  }, [apiReturned, localReturned]);

  const handleClearDeleted = () => {
    clearDeleted();
    setDeletedItems([]);
    toast.success("Устгасан түүх цэвэрлэгдлээ");
  };

  const activeItems = (tab === "returned" ? returnedItems : deletedItems).filter(i =>
    !search ||
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <h1>📚 Архив</h1>
          <p>Устгасан болон эзэндэн хүрсэн зүйлсийн түүх</p>
        </div>

        {/* Tabs */}
        <div className="archive-tabs">
          <button
            className={`archive-tab${tab === "returned" ? " active" : ""}`}
            onClick={() => { setTab("returned"); setSearch(""); }}
          >
            ✅ Эзэндэн хүрсэн
            <span className="tab-badge">{returnedItems.length}</span>
          </button>

          <button
            className={`archive-tab${tab === "deleted" ? " active" : ""}`}
            onClick={() => { setTab("deleted"); setSearch(""); }}
          >
            🗑 Устгасан
            <span className="tab-badge">{deletedItems.length}</span>
          </button>

          {tab === "deleted" && deletedItems.length > 0 && (
            <button
              className="btn btn-danger"
              style={{ marginLeft: "auto", padding: "6px 13px", fontSize: 13 }}
              onClick={handleClearDeleted}
            >
              Бүгдийг цэвэрлэх
            </button>
          )}
        </div>

        {/* Search */}
        <div className="search-bar" style={{ marginTop: 20 }}>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Хайх... (нэр, байршил, тайлбар)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!loading && (
            <span className="result-count" style={{ alignSelf: "center" }}>
              {activeItems.length} илэрц
            </span>
          )}
        </div>

        {/* Content */}
        {loading && tab === "returned" ? (
          <div className="loading"><div className="spinner" /> Ачаалж байна...</div>
        ) : activeItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{tab === "returned" ? "✅" : "🗑"}</div>
            <h3>
              {search
                ? "Илэрц олдсонгүй"
                : tab === "returned"
                  ? "Эзэндэн хүрсэн зүйл байхгүй"
                  : "Устгасан зүйлийн түүх хоосон"}
            </h3>
            <p>
              {search
                ? "Өөр утгаар хайж үзнэ үү"
                : tab === "returned"
                  ? "Зүйлийн хажуух ✅ товчийг дарж тэмдэглэнэ үү"
                  : "Зүйл устгахад энд автоматаар хадгалагдана"}
            </p>
          </div>
        ) : (
          <div className="item-grid">
            {activeItems.map((item, idx) => (
              <ItemCard key={item._id || idx} item={item} tab={tab} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Archive;
