import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getLiked, toggleLike } from "../utils/likedItems";
import toast from "react-hot-toast";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='150' y='95' width='100' height='82' rx='8' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='22' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='9' fill='%23d1d5db'/%3E%3Crect x='162' y='103' width='18' height='10' rx='3' fill='%23d1d5db'/%3E%3C/svg%3E";
const BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace("/api", "");

function SavedItems() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getLiked());
  }, []);

  const remove = (item) => {
    toggleLike(item);
    setItems(prev => prev.filter(i => i._id !== item._id));
    toast("Хадгалсанаас хасагдлаа", { duration: 1300 });
  };

  const clearAll = () => {
    items.forEach(i => toggleLike(i));
    setItems([]);
    toast("Бүгд арилгагдлаа", { duration: 1500 });
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>❤️ Хадгалсан зүйлс</h1>
          <p>Таны дуртай зүйлсийн жагсаалт</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤍</div>
            <h3>Хадгалсан зүйл байхгүй</h3>
            <p>Зүйл харахдаа ❤️ дарж хадгалаарай</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18 }}>
              <Link to="/lost"  className="btn btn-primary">🔴 Хаясан харах</Link>
              <Link to="/found" className="btn btn-outline">🟢 Олдсон харах</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="saved-header">
              <span className="result-count">{items.length} зүйл хадгалагдсан</span>
              <button className="btn btn-outline saved-clear-btn" onClick={clearAll}>
                🗑 Бүгдийг арилгах
              </button>
            </div>

            <div className="saved-grid">
              {items.map(item => {
                const imgSrc = item.image ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `${BASE_URL}/uploads/${item.image}`) : FALLBACK;
                return (
                  <div className="saved-card" key={item._id}>
                    <div className="saved-img-wrap">
                      <img
                        src={imgSrc}
                        className="saved-img"
                        alt={item.title}
                        onError={e => { e.target.src = FALLBACK; }}
                      />
                      <span className={`card-type-badge ${item.type === "lost" ? "lost" : "found"}`}>
                        {item.type === "lost" ? "Хаясан" : "Олдсон"}
                      </span>
                    </div>
                    <div className="saved-body">
                      <Link to={`/item/${item._id}`} className="saved-title">{item.title}</Link>
                      {item.location && (
                        <p className="saved-location">📍 {item.location}</p>
                      )}
                      <div className="saved-actions">
                        <Link to={`/item/${item._id}`} className="btn btn-primary saved-view-btn">
                          Дэлгэрэнгүй
                        </Link>
                        <button
                          className="btn btn-outline saved-remove-btn"
                          onClick={() => remove(item)}
                          title="Хасах"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SavedItems;
