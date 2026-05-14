import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import { saveDeleted, saveReturned } from "../utils/history";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function AdminMessageThread({ claim, onMessageSent }) {
  const [reply,   setReply]   = React.useState("");
  const [sending, setSending] = React.useState(false);
  const msgs = claim.messages || [];

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/claims/${claim._id}/message`, {
        sender: "admin",
        text:   reply.trim(),
      });
      onMessageSent(claim._id, res.data.messages);
      setReply("");
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  return (
    <div className="aclaim-thread">
      <div className="aclaim-thread-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Харилцааны түүх {msgs.length > 0 && <span className="aclaim-msg-count">{msgs.length}</span>}
      </div>

      {msgs.length > 0 && (
        <div className="aclaim-msg-list">
          {msgs.map((m, i) => (
            <div key={i} className={`aclaim-msg ${m.sender}`}>
              <span className="aclaim-msg-who">{m.sender === "admin" ? "Админ" : "Хэрэглэгч"}</span>
              <span className="aclaim-msg-text">{m.text}</span>
              <span className="aclaim-msg-time">
                {new Date(m.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}

      <form className="aclaim-reply-form" onSubmit={send}>
        <input
          className="aclaim-reply-input"
          placeholder="Хэрэглэгчид хариу бичих..."
          value={reply}
          onChange={e => setReply(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="aclaim-send-btn" disabled={sending || !reply.trim()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

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
  const [tab,      setTab]     = useState("items");
  const [items,    setItems]   = useState([]);
  const [claims,   setClaims]  = useState([]);
  const [search,   setSearch]  = useState("");
  const [loading,  setLoading] = useState(true);
  const [confirm,  setConfirm] = useState({ open: false, id: null, action: null });
  const [noteFor,  setNoteFor] = useState(null);   // { id, action }
  const [noteText, setNoteText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadItems();
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const res = await axios.get(`${API_URL}/claims`);
      setClaims(res.data);
    } catch {
      toast.error("Хүсэлтүүд ачаалахад алдаа гарлаа");
    }
  };

  const approveClaim = async (id, note = "") => {
    try {
      await axios.put(`${API_URL}/claims/${id}/approve`, { adminNote: note });
      toast.success("✅ Хүсэлт зөвшөөрөгдлөө");
      loadClaims();
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Алдаа гарлаа");
    }
  };

  const rejectClaim = async (id, note = "") => {
    try {
      await axios.put(`${API_URL}/claims/${id}/reject`, { adminNote: note });
      toast.success("❌ Хүсэлт татгалзагдлаа");
      loadClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || "Алдаа гарлаа");
    }
  };

  const startNote = (id, action) => { setNoteFor({ id, action }); setNoteText(""); };
  const cancelNote = () => setNoteFor(null);
  const submitNote = async () => {
    if (!noteFor) return;
    if (noteFor.action === "approve") await approveClaim(noteFor.id, noteText);
    else await rejectClaim(noteFor.id, noteText);
    setNoteFor(null);
  };

  const loadItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
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
    try { await axios.put(`${API_URL}/items/${id}`, { status: "returned" }); } catch {}
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
            {tab === "items" && (
              <>
                <div className="search-input-wrap" style={{ maxWidth: 240 }}>
                  <span className="search-icon">🔍</span>
                  <input placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn-export" onClick={exportCSV} title="CSV татах">
                  ⬇️ CSV татах
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="archive-tabs" style={{ marginBottom: 20 }}>
          <button
            className={`archive-tab${tab === "items" ? " active" : ""}`}
            onClick={() => setTab("items")}
          >
            📋 Зүйлс
            <span className="tab-badge">{items.length}</span>
          </button>
          <button
            className={`archive-tab${tab === "claims" ? " active" : ""}`}
            onClick={() => setTab("claims")}
          >
            🔐 Хүсэлтүүд
            {claims.filter(c => c.status === "pending").length > 0 && (
              <span className="tab-badge" style={{ background: "#ef4444", color: "#fff" }}>
                {claims.filter(c => c.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        {tab === "items" && (
          <>
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
          </>
        )}

        {tab === "claims" && (
          <div>
            {claims.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔐</div>
                <h3>Хүсэлт байхгүй</h3>
                <p>Одоогоор эзэмшлийн хүсэлт ирээгүй байна</p>
              </div>
            ) : (
              <div className="aclaim-list">
                {claims.map(claim => (
                  <div key={claim._id} className={`aclaim-card aclaim-${claim.status}`}>

                    {/* Header */}
                    <div className="aclaim-header">
                      <div className="aclaim-info">
                        <strong className="aclaim-title">{claim.item?.title || "—"}</strong>
                        <span className="aclaim-meta">
                          👤 {claim.claimantName} &nbsp;·&nbsp; 📞 {claim.claimantContact}
                          &nbsp;·&nbsp; {new Date(claim.createdAt).toLocaleDateString("mn-MN")}
                        </span>
                      </div>
                      <span className={`status-badge ${claim.status === "approved" ? "returned" : claim.status}`}>
                        {claim.status === "pending" ? "⏳ Хүлээгдэж" : claim.status === "approved" ? "✅ Зөвшөөрсөн" : "❌ Татгалзсан"}
                      </span>
                    </div>

                    {/* Proof */}
                    <div className="aclaim-proof">
                      <span className="aclaim-proof-label">Нотолгоо:</span>
                      <p>{claim.proofText}</p>
                    </div>

                    {/* Approve / Reject */}
                    {claim.status === "pending" && (
                      <div className="aclaim-actions">
                        {noteFor?.id === claim._id ? (
                          <div className="admin-note-form">
                            <textarea
                              className="admin-note-input"
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              placeholder="Хэрэглэгчид илгээх хариу мессеж бичнэ үү (заавал биш)..."
                              rows={2}
                            />
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="btn"
                                style={{
                                  flex: 1, padding: "8px 14px", fontSize: 13,
                                  background: noteFor.action === "approve" ? "#f0fdf4" : "#fef2f2",
                                  color:      noteFor.action === "approve" ? "#15803d" : "#b91c1c",
                                  border:     noteFor.action === "approve" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                  borderRadius: 8, fontWeight: 600,
                                }}
                                onClick={submitNote}
                              >
                                {noteFor.action === "approve" ? "✅ Зөвшөөрөх" : "❌ Татгалзах"}
                              </button>
                              <button
                                className="btn"
                                style={{ padding: "8px 14px", fontSize: 13, background: "var(--border)", color: "var(--muted)", borderRadius: 8 }}
                                onClick={cancelNote}
                              >Болих</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn"
                              style={{ padding: "8px 16px", fontSize: 13, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 8, fontWeight: 600 }}
                              onClick={() => startNote(claim._id, "approve")}
                            >✅ Зөвшөөрөх</button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8 }}
                              onClick={() => startNote(claim._id, "reject")}
                            >❌ Татгалзах</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message thread */}
                    <AdminMessageThread
                      claim={claim}
                      onMessageSent={(id, msgs) =>
                        setClaims(prev => prev.map(c => c._id === id ? { ...c, messages: msgs } : c))
                      }
                    />

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;
