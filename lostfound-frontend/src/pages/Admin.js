import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import Lightbox from "../components/Lightbox";
import { saveDeleted, saveReturned } from "../utils/history";
import API from "../services/api";
import axios from "axios";
import socket from "../socket";

const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", "");

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23f3f4f6' rx='6'/%3E%3Crect x='18' y='14' width='24' height='20' rx='3' fill='none' stroke='%23d1d5db' stroke-width='2'/%3E%3Ccircle cx='30' cy='24' r='5' fill='none' stroke='%23d1d5db' stroke-width='2'/%3E%3C/svg%3E";

const getImgSrc = (image) =>
  image
    ? (image.startsWith("http") || image.startsWith("data:") ? image : `${BASE_URL}/uploads/${image}`)
    : FALLBACK;

function AdminMessageThread({ claim, onMessageSent }) {
  const [reply,   setReply]   = React.useState("");
  const [sending, setSending] = React.useState(false);
  const msgs = claim.messages || [];

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await API.post(`/claims/${claim._id}/message`, {
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
  const [tab,        setTab]       = useState("items");
  const [items,      setItems]     = useState([]);
  const [claims,     setClaims]    = useState([]);
  const [showAllClaims, setShowAllClaims] = useState(false);
  const [search,     setSearch]    = useState("");
  const [loading,    setLoading]   = useState(true);
  const [confirm,    setConfirm]   = useState({ open: false, id: null, action: null });
  const [noteFor,    setNoteFor]   = useState(null);
  const [noteText,   setNoteText]  = useState("");
  const [lightbox,   setLightbox]  = useState(null);
  // Users tab
  const [users,        setUsers]        = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [giveFor,      setGiveFor]      = useState(null);  // userId being awarded
  const [giveAmt,      setGiveAmt]      = useState("");
  const [giveMsg,      setGiveMsg]      = useState("");
  const [giveSending,  setGiveSending]  = useState(false);
  // Chat state
  const [chatRooms,  setChatRooms]  = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [chatMsgs,   setChatMsgs]   = useState([]);
  const [chatText,   setChatText]   = useState("");
  const [chatUnread, setChatUnread] = useState(0);
  const chatBottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadItems();
    loadClaims();
    loadChatRooms();

    // Admin socket: admin_chat өрөөнд орж шинэ мессеж хүлээн авна
    socket.emit("join_room", "admin_chat");

    // Харилцааны жагсаалт + unread тоо шинэчлэх
    socket.on("new_user_msg", ({ room, msg }) => {
      setChatRooms(prev => {
        const exists = prev.find(r => r._id === room);
        if (exists) {
          return prev.map(r => r._id === room ? { ...r, lastMessage: msg } : r)
            .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
        }
        return [{ _id: room, lastMessage: msg, total: 1 }, ...prev];
      });
      setActiveRoom(cur => {
        if (cur !== room) setChatUnread(n => n + 1);
        return cur;
      });
    });

    // Нээлттэй өрөөний мессежүүдийг real-time шинэчлэх (user мессеж, admin-ийнх optimistic-ээр)
    socket.on("new_chat_message", (msg) => {
      if (msg.sender === "admin") return;
      setActiveRoom(cur => {
        if (cur === msg.room) setChatMsgs(prev => [...prev, msg]);
        return cur;
      });
    });

    return () => {
      socket.off("new_user_msg");
      socket.off("new_chat_message");
      socket.emit("leave_room", "admin_chat");
    };
  }, []);

  const loadClaims = async () => {
    try {
      const res = await API.get(`/claims`);
      setClaims(res.data);
    } catch {
      toast.error("Хүсэлтүүд ачаалахад алдаа гарлаа");
    }
  };

  const loadChatRooms = async () => {
    try {
      const res = await API.get(`/chat/rooms`);
      setChatRooms(res.data);
    } catch { /* silent */ }
  };

  const openRoom = async (room) => {
    setActiveRoom(room);
    setChatUnread(0);
    try {
      const res = await axios.get(`${API_URL}/chat/${room}`);
      setChatMsgs(res.data);
      socket.emit("join_room", room);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch { /* silent */ }
  };

  const sendAdminMessage = async (e) => {
    e.preventDefault();
    const trimmed = chatText.trim();
    if (!trimmed || !activeRoom) return;
    const tempMsg = {
      _id:       Date.now().toString(),
      room:      activeRoom,
      sender:    "admin",
      name:      "Админ",
      text:      trimmed,
      createdAt: new Date().toISOString(),
    };
    setChatMsgs(prev => [...prev, tempMsg]);
    setChatText("");
    try {
      await axios.post(`${API_URL}/chat`, {
        room:   activeRoom,
        sender: "admin",
        name:   "Админ",
        text:   trimmed,
      });
    } catch {
      setChatMsgs(prev => prev.filter(m => m._id !== tempMsg._id));
      setChatText(trimmed);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const approveClaim = async (id, note = "") => {
    try {
      await API.put(`/claims/${id}/approve`, { adminNote: note });
      toast.success("✅ Хүсэлт зөвшөөрөгдлөө");
      // Жагсаалтаас шууд арилгана (approved болсон)
      setClaims(prev => prev.filter(c => c._id !== id));
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Алдаа гарлаа");
    }
  };

  const rejectClaim = async (id, note = "") => {
    try {
      await API.put(`/claims/${id}/reject`, { adminNote: note });
      toast.success("❌ Хүсэлт татгалзагдлаа");
      // Жагсаалтаас шууд арилгана (rejected болсон)
      setClaims(prev => prev.filter(c => c._id !== id));
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
      const res = await API.get(`/items`);
      setItems(res.data);
    } catch {
      toast.error("Мэдээлэл ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const fixBrokenImages = async () => {
    const tid = toast.loading("Эвдэрсэн зурагнуудыг цэвэрлэж байна...");
    try {
      const res = await API.post(`/items/fix-images`);
      toast.success(res.data.message, { id: tid, duration: 4000 });
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Алдаа гарлаа", { id: tid });
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await API.get(`/users`);
      setUsers(res.data);
    } catch {
      toast.error("Хэрэглэгчид ачаалахад алдаа гарлаа");
    } finally {
      setUsersLoading(false);
    }
  };

  const sendAdminGive = async (userId) => {
    const amt = parseInt(giveAmt, 10);
    if (!amt || amt < 1) { toast.error("Дүн оруулна уу"); return; }
    setGiveSending(true);
    try {
      const res = await API.post(`/donations/admin-give`, {
        toId:    userId,
        amount:  amt,
        message: giveMsg.trim() || "Админаас шагнал",
      });
      toast.success(res.data.message);
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, points: res.data.points } : u
      ));
      setGiveFor(null);
      setGiveAmt("");
      setGiveMsg("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setGiveSending(false);
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
      await API.delete(`/items/${id}`);
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
    try { await API.put(`/items/${id}/status`, { status: "returned" }); } catch {}
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

      {lightbox && <Lightbox src={lightbox} alt="Зураг" onClose={() => setLightbox(null)} />}

      <div className="admin-page">

        {/* ── Banner header ── */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
              </svg>
            </div>
            <div>
              <h1 className="admin-banner-title">Админ Панел</h1>
              <p className="admin-banner-sub">
                Нийт <strong>{items.length}</strong> зүйл &nbsp;·&nbsp;
                <span style={{ color: "#f59e0b" }}>{pendingCount} хүлээгдэж буй</span>
              </p>
            </div>
          </div>
          <div className="admin-header-actions">
            {tab === "items" && (
              <>
                <div className="search-input-wrap" style={{ maxWidth: 220 }}>
                  <span className="search-icon">🔍</span>
                  <input placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button
                  className="btn-export"
                  onClick={fixBrokenImages}
                  title="Render disk-ийн буруу зургийн линкүүдийг цэвэрлэх"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", border: "none" }}
                >
                  🔧 Зураг засах
                </button>
                <button className="btn-export" onClick={exportCSV}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  CSV татах
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="admin-tabs">
          {[
            { key: "items",  icon: "📋", label: "Зүйлс",     badge: items.length,                                     badgeColor: "" },
            { key: "claims", icon: "🔐", label: "Хүсэлтүүд", badge: claims.filter(c => c.status === "pending").length, badgeColor: "#ef4444" },
            { key: "users",  icon: "👥", label: "Хэрэглэгчид", badge: users.length,                                   badgeColor: "" },
            { key: "chat",   icon: "💬", label: "Чат",        badge: chatUnread,                                        badgeColor: "#6366f1" },
          ].map(t => (
            <button
              key={t.key}
              className={`admin-tab${tab === t.key ? " active" : ""}`}
              onClick={() => {
                setTab(t.key);
                if (t.key === "chat")  setChatUnread(0);
                if (t.key === "users" && users.length === 0) loadUsers();
              }}
            >
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span className="admin-tab-badge" style={t.badgeColor ? { background: t.badgeColor, color: "#fff" } : {}}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "items" && (
          <>
            {/* ── Stat cards ── */}
            <div className="admin-stats-v2">
              {[
                { icon: "📦", num: items.length,  label: "Нийт зүйл",       color: "#6366f1", bg: "rgba(99,102,241,0.10)"  },
                { icon: "🔴", num: lostCount,      label: "Хаясан",           color: "#ef4444", bg: "rgba(239,68,68,0.10)"   },
                { icon: "🟢", num: foundCount,     label: "Олдсон",           color: "#3b82f6", bg: "rgba(59,130,246,0.10)"  },
                { icon: "✅", num: returnedCount,  label: "Эзэндэн хүрсэн",  color: "#10b981", bg: "rgba(16,185,129,0.10)"  },
                { icon: "⏳", num: pendingCount,   label: "Хүлээгдэж буй",   color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
              ].map((s, i) => (
                <div key={i} className="asv-card">
                  <div className="asv-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="asv-num"  style={{ color: s.color }}>{s.num}</div>
                  <div className="asv-label">{s.label}</div>
                  <div className="asv-accent" style={{ background: s.color }} />
                </div>
              ))}
            </div>

            {!loading && <AdminChart items={items} />}

            {loading ? (
              <div className="loading"><div className="spinner" /> Ачаалж байна...</div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Зүйл</th>
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
                        <td>
                          <div className="atbl-item-cell">
                            <img
                              className={`atbl-thumb${item.image ? " clickable-img" : " atbl-thumb-empty"}`}
                              src={getImgSrc(item.image)}
                              alt=""
                              onClick={() => item.image && setLightbox(getImgSrc(item.image))}
                              title={item.image ? "Дарж томруулах" : ""}
                            />
                            <div>
                              <div className="atbl-title">{item.title}</div>
                              {item.description && <div className="atbl-desc">{item.description.slice(0, 50)}{item.description.length > 50 ? "…" : ""}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`card-type-badge ${item.type}`} style={{ position: "static" }}>
                            {item.type === "lost" ? "Хаясан" : "Олдсон"}
                          </span>
                        </td>
                        <td className="atbl-loc">{item.location || "—"}</td>
                        <td>
                          <span className={`status-badge ${item.status || "pending"}`}>
                            {item.status === "returned" ? "✅ Хүрсэн" : item.status === "pending" || !item.status ? "⏳ Хүлээгдэж" : item.status}
                          </span>
                        </td>
                        <td className="atbl-date">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("mn-MN") : "—"}</td>
                        <td>
                          <div className="atbl-actions">
                            {item.status !== "returned" && (
                              <button className="atbl-btn success" onClick={() => openConfirm(item._id, "returned")}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Хүрсэн
                              </button>
                            )}
                            <button className="atbl-btn danger" onClick={() => openConfirm(item._id, "delete")}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/></svg>
                              Устгах
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
            {/* Filter toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {claims.filter(c => c.status === "pending").length} хүлээгдэж буй
                {claims.filter(c => c.status !== "pending").length > 0 && ` · ${claims.filter(c => c.status !== "pending").length} шийдэгдсэн`}
              </span>
              {claims.some(c => c.status !== "pending") && (
                <button
                  onClick={() => setShowAllClaims(v => !v)}
                  style={{
                    fontSize: 12, padding: "4px 12px", borderRadius: 20,
                    border: "1px solid var(--border)", background: showAllClaims ? "var(--primary)" : "var(--bg)",
                    color: showAllClaims ? "white" : "var(--muted)", cursor: "pointer",
                  }}
                >
                  {showAllClaims ? "Зөвхөн хүлээгдэж буй харах" : "Бүгдийг харах"}
                </button>
              )}
            </div>

            {(() => {
              const visible = showAllClaims ? claims : claims.filter(c => c.status === "pending");
              return visible.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>Хүлээгдэж буй хүсэлт байхгүй</h3>
                <p>Бүх хүсэлт шийдэгдсэн байна</p>
              </div>
            ) : (
              <div className="aclaim-list">
                {visible.map(claim => (
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
                            <div style={{ position: "relative" }}>
                              <textarea
                                className="admin-note-input"
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Хэрэглэгчид илгээх хариу мессеж бичнэ үү (заавал биш)..."
                                rows={2}
                                style={{ paddingRight: 36 }}
                              />
                              {noteText && (
                                <button
                                  type="button"
                                  title="Арилгах"
                                  onClick={() => setNoteText("")}
                                  style={{
                                    position: "absolute", top: 8, right: 8,
                                    background: "none", border: "none", cursor: "pointer",
                                    color: "var(--muted)", fontSize: 16, lineHeight: 1,
                                    padding: "2px 4px", borderRadius: 4,
                                  }}
                                >✕</button>
                              )}
                            </div>
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
            );
            })()}
          </div>
        )}

        {/* ── ХЭРЭГЛЭГЧДИЙН TAB ── */}
        {tab === "users" && (
          <div>
            {usersLoading ? (
              <div className="loading"><div className="spinner" /> Ачаалж байна...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Хэрэглэгч байхгүй</h3>
              </div>
            ) : (
              <div className="auser-list">
                {users.map((u, i) => (
                  <div key={u._id} className="auser-card">
                    <div className="auser-rank">#{i + 1}</div>

                    <img
                      className="auser-avatar"
                      src={u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=6366f1&color=fff&size=80`}
                      alt={u.name}
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=6366f1&color=fff&size=80`; }}
                    />

                    <div className="auser-info">
                      <div className="auser-name">
                        {u.name}
                        {u.role === "admin" && <span className="auser-admin-tag">Admin</span>}
                      </div>
                      <div className="auser-email">{u.email}</div>
                    </div>

                    <div className="auser-points">⭐ {u.points || 0}</div>

                    {u.role !== "admin" && (
                      <div className="auser-actions">
                        {giveFor === u._id ? (
                          <div className="auser-give-form">
                            <input
                              className="auser-give-input"
                              type="number"
                              min={1}
                              placeholder="Оноо"
                              value={giveAmt}
                              onChange={e => setGiveAmt(e.target.value)}
                              autoFocus
                            />
                            <input
                              className="auser-give-msg"
                              placeholder="Шагналын шалтгаан..."
                              value={giveMsg}
                              onChange={e => setGiveMsg(e.target.value)}
                              maxLength={100}
                            />
                            <div className="auser-give-btns">
                              <button
                                className="auser-give-send"
                                disabled={giveSending || !giveAmt || parseInt(giveAmt) < 1}
                                onClick={() => sendAdminGive(u._id)}
                              >
                                {giveSending ? "..." : "✅ Өгөх"}
                              </button>
                              <button
                                className="auser-give-cancel"
                                onClick={() => { setGiveFor(null); setGiveAmt(""); setGiveMsg(""); }}
                              >
                                Болих
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="auser-give-btn"
                            onClick={() => { setGiveFor(u._id); setGiveAmt(""); setGiveMsg(""); }}
                          >
                            ⭐ Оноо өгөх
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ЧАТЫН TAB ── */}
        {tab === "chat" && (
          <div className="admin-chat-layout">

            {/* Өрөөнүүдийн жагсаалт */}
            <div className="admin-chat-rooms">
              <div className="admin-chat-rooms-header">💬 Харилцааны жагсаалт</div>
              {chatRooms.length === 0 ? (
                <div className="admin-chat-empty">
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <p>Одоогоор мессеж байхгүй</p>
                </div>
              ) : (
                chatRooms.map(r => (
                  <button
                    key={r._id}
                    className={`admin-chat-room-item${activeRoom === r._id ? " active" : ""}`}
                    onClick={() => openRoom(r._id)}
                  >
                    <div className="acr-avatar">👤</div>
                    <div className="acr-info">
                      <div className="acr-name">{r.lastMessage?.name || r._id}</div>
                      <div className="acr-preview">{r.lastMessage?.text || ""}</div>
                    </div>
                    <div className="acr-time">
                      {r.lastMessage?.createdAt
                        ? new Date(r.lastMessage.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Мессежийн харилцаа */}
            <div className="admin-chat-convo">
              {!activeRoom ? (
                <div className="admin-chat-empty" style={{ flex: 1 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p>Харилцааны өрөө сонгоно уу</p>
                </div>
              ) : (
                <>
                  <div className="admin-chat-convo-header">
                    <span>📞 {activeRoom.replace("user_", "")}</span>
                  </div>
                  <div className="admin-chat-messages">
                    {chatMsgs.map((m, i) => (
                      <div key={i} className={`chat-bubble ${m.sender}`}>
                        <p>{m.text}</p>
                        <span className="chat-time">
                          {m.sender === "user" ? `${m.name} · ` : "Админ · "}
                          {new Date(m.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                  <form className="chat-input-row" onSubmit={sendAdminMessage}>
                    <input
                      className="chat-text-input"
                      placeholder="Хариу бичнэ үү..."
                      value={chatText}
                      onChange={e => setChatText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdminMessage(e); } }}
                    />
                    <button type="submit" className="chat-send-btn" disabled={!chatText.trim()}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </form>
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;
