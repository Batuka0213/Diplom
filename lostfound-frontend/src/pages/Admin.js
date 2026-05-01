import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import { saveDeleted, saveReturned } from "../utils/history";

const BAR_COLORS = {
  lost:     "#ef4444",
  found:    "#3b82f6",
  returned: "#10b981",
  pending:  "#f59e0b",
};

function AdminChart({ items }) {
  const bars = [
    { key: "lost",     label: "Хаясан",   count: items.filter(i => i.type === "lost").length,                        color: BAR_COLORS.lost },
    { key: "found",    label: "Олдсон",   count: items.filter(i => i.type === "found").length,                       color: BAR_COLORS.found },
    { key: "returned", label: "Хүрсэн",   count: items.filter(i => i.status === "returned").length,                  color: BAR_COLORS.returned },
    { key: "pending",  label: "Хүлээгдэж", count: items.filter(i => !i.status || i.status === "pending").length,    color: BAR_COLORS.pending },
  ];
  const max = Math.max(...bars.map(b => b.count), 1);

  return (
    <div className="admin-chart-section">
      <div className="admin-chart-title">📊 Статистик харагдац</div>
      <div className="chart-bars">
        {bars.map(b => (
          <div className="chart-bar-wrap" key={b.key}>
            <div className="chart-bar-value">{b.count}</div>
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{
                  height: `${(b.count / max) * 100}%`,
                  background: b.color,
                  opacity: 0.85,
                }}
              />
            </div>
            <div className="chart-bar-label">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Admin() {
  const [items,   setItems]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, id: null, action: null });
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/items");
      setItems(res.data);
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
  };

  const exportCSV = () => {
    const headers = ["Гарчиг", "Төрөл", "Байршил", "Холбоо барих", "Төлөв", "Огноо"];
    const rows = items.map(i => [
      `"${(i.title || "").replace(/"/g, '""')}"`,
      i.type === "lost" ? "Хаясан" : "Олдсон",
      `"${(i.location || "").replace(/"/g, '""')}"`,
      i.contact || "",
      i.status || "pending",
      i.createdAt ? new Date(i.createdAt).toLocaleDateString("mn-MN") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `items_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV татагдлаа ✅");
  };

  const lostCount     = items.filter(i => i.type === "lost").length;
  const foundCount    = items.filter(i => i.type === "found").length;
  const returnedCount = items.filter(i => i.status === "returned").length;
  const pendingCount  = items.filter(i => !i.status || i.status === "pending").length;

  const filtered = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  );

  const confirmItem = items.find(i => i._id === confirm.id);

  return (
    <div>
      <Navbar />

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

      <div className="admin-page">

        <div className="admin-header">
          <h1>⚙️ Админ Панел</h1>
          <div className="admin-header-actions">
            <div className="search-input-wrap" style={{ maxWidth: 240 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-export" onClick={exportCSV} title="CSV татах">
              ⬇️ CSV татах
            </button>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="num">{items.length}</div>
            <div className="label">Нийт</div>
          </div>
          <div className="admin-stat">
            <div className="num" style={{ color: "#ef4444" }}>{lostCount}</div>
            <div className="label">Хаясан</div>
          </div>
          <div className="admin-stat">
            <div className="num" style={{ color: "#3b82f6" }}>{foundCount}</div>
            <div className="label">Олдсон</div>
          </div>
          <div className="admin-stat">
            <div className="num" style={{ color: "#10b981" }}>{returnedCount}</div>
            <div className="label">Эзэндэн хүрсэн</div>
          </div>
          <div className="admin-stat">
            <div className="num" style={{ color: "#f59e0b" }}>{pendingCount}</div>
            <div className="label">Хүлээгдэж буй</div>
          </div>
        </div>

        {!loading && <AdminChart items={items} />}

        {loading ? (
          <div className="loading"><div className="spinner" /> Ачаалж байна...</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Гарчиг</th>
                  <th>Төрөл</th>
                  <th>Байршил</th>
                  <th>Төлөв</th>
                  <th>Огноо</th>
                  <th>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id}>
                    <td><strong>{item.title}</strong></td>
                    <td>
                      <span className={`card-type-badge ${item.type}`} style={{ position: "static" }}>
                        {item.type === "lost" ? "Хаясан" : "Олдсон"}
                      </span>
                    </td>
                    <td>{item.location || "—"}</td>
                    <td>
                      <span className={`status-badge ${item.status || "pending"}`}>
                        {item.status || "pending"}
                      </span>
                    </td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("mn-MN") : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {item.status !== "returned" && (
                          <button
                            className="btn"
                            style={{ padding: "5px 10px", fontSize: 12, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6 }}
                            onClick={() => openConfirm(item._id, "returned")}
                          >
                            ✅ Хүрсэн
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          style={{ padding: "5px 10px", fontSize: 12 }}
                          onClick={() => openConfirm(item._id, "delete")}
                        >
                          🗑 Устгах
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;
