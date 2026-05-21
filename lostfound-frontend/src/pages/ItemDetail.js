import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Lightbox from "../components/Lightbox";
import MapView from "../components/MapView";
import { addRecentlyViewed } from "../utils/recentlyViewed";
import { timeAgo } from "../utils/timeAgo";
import { toggleLike, isLiked } from "../utils/likedItems";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='150' y='95' width='100' height='82' rx='8' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='22' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='9' fill='%23d1d5db'/%3E%3Crect x='162' y='103' width='18' height='10' rx='3' fill='%23d1d5db'/%3E%3C/svg%3E";
const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", "");

const copyContact = (num) => {
  navigator.clipboard.writeText(num).catch(() => {});
  toast.success(`${num} — хуулагдлаа 📋`, { duration: 1500 });
};

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item,    setItem]    = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [liked,   setLiked]   = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/items/${id}`)
      .then(res => {
        setItem(res.data);
        addRecentlyViewed(res.data);
        setLiked(isLiked(res.data._id));
      })
      .catch(console.log);

  }, [id]);

  const handleLike = () => {
    if (!item) return;
    const nowLiked = toggleLike(item);
    setLiked(nowLiked);
    toast(nowLiked ? "❤️ Хадгалагдлаа" : "Хадгалсанаас хасагдлаа", { duration: 1300 });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item?.title, text: item?.description || "", url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Холбоос хуулагдлаа 📋");
    }
  };

  const handlePrint = () => window.print();

  if (!item) return (
    <div>
      <Navbar />
      <div className="loading"><div className="spinner" /> Ачаалж байна...</div>
    </div>
  );

  const imgSrc  = item.image ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `${BASE_URL}/uploads/${item.image}`) : FALLBACK;
  const contact = item.contact || "86788622";

  return (
    <div>
      <Navbar />

      {lightbox && (
        <Lightbox src={lightbox} alt={item.title} onClose={() => setLightbox(null)} />
      )}

      <div className="detail-page">

        <div className="detail-card">
          <div className="detail-img-wrap">
            <img
              src={imgSrc}
              className="detail-img clickable-img"
              alt={item.title}
              onError={e => { e.target.src = FALLBACK; }}
              onClick={() => setLightbox(imgSrc)}
              title="Дарж томруулж харах"
            />
            <div className="detail-img-hint">🔍 Дарж томруулах</div>
          </div>

          <div className="detail-body">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span className={`card-type-badge ${item.type}`} style={{ position: "static" }}>
                {item.type === "lost" ? "Хаясан" : "Олдсон"}
              </span>
              <span className={`status-badge ${item.status || "pending"}`}>
                {item.status || "pending"}
              </span>
            </div>

            <h2>{item.title}</h2>
            <p className="detail-desc">{item.description}</p>

            <div className="detail-meta">
              <div className="detail-meta-item">
                <div className="meta-icon">📍</div>
                <div>
                  <strong style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Байршил</strong>
                  {item.location || "—"}
                </div>
              </div>

              <div className="detail-meta-item copyable" onClick={() => copyContact(contact)} title="Дарж хуулах">
                <div className="meta-icon">📞</div>
                <div>
                  <strong style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>
                    Холбоо барих <span style={{ fontSize: 10 }}>📋</span>
                  </strong>
                  {contact}
                </div>
              </div>

              <div className="detail-meta-item">
                <div className="meta-icon">📅</div>
                <div>
                  <strong style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Огноо</strong>
                  {timeAgo(item.createdAt)}
                </div>
              </div>
            </div>

            <div className="detail-share-row">
              <button className={`btn-icon${liked ? " liked" : ""}`} onClick={handleLike} title="Хадгалах">
                {liked ? "❤️" : "🤍"}
              </button>
              <button className="btn btn-outline detail-share-btn" onClick={handleShare} title="Хуваалцах">
                🔗 Хуваалцах
              </button>
              <button className="btn btn-outline detail-print-btn" onClick={handlePrint} title="Хэвлэх">
                🖨️ Хэвлэх
              </button>
            </div>
          </div>
        </div>

        {/* ── MAP SECTION ── */}
        {item.location && (
          <div className="map-section">
            <div className="map-section-header">
              <h3>📍 Байршлын газрын зураг</h3>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(item.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="map-gmaps-link"
              >
                Google Maps ↗
              </a>
            </div>
            <div className="map-card">
              <MapView location={item.location} />
            </div>
          </div>
        )}


      </div>
    </div>
  );
}

export default ItemDetail;
