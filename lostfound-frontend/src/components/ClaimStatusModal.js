import React, { useState } from "react";
import axios from "axios";

const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", "");
const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f3f4f6' rx='8'/%3E%3Crect x='25' y='18' width='30' height='25' rx='4' fill='none' stroke='%23d1d5db' stroke-width='2'/%3E%3Ccircle cx='40' cy='31' r='7' fill='none' stroke='%23d1d5db' stroke-width='2'/%3E%3C/svg%3E";

const STATUS_MAP = {
  pending:  { label: "Хүлээгдэж байна", cls: "pending",  icon: "⏳" },
  approved: { label: "Зөвшөөрөгдсөн",   cls: "returned", icon: "✅" },
  rejected: { label: "Татгалзагдсан",    cls: "rejected", icon: "❌" },
};

function MessageThread({ claim, onMessageSent }) {
  const [reply,   setReply]   = useState("");
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/claims/${claim._id}/message`, {
        sender: "user",
        text:   reply.trim(),
      });
      onMessageSent(claim._id, res.data.messages);
      setReply("");
    } catch {
      /* silent */
    } finally {
      setSending(false);
    }
  };

  const msgs = claim.messages || [];

  return (
    <div className="msg-thread">
      {msgs.length > 0 && (
        <div className="msg-list">
          {msgs.map((m, i) => (
            <div key={i} className={`msg-bubble ${m.sender}`}>
              <span className="msg-sender">{m.sender === "admin" ? "Админ" : "Та"}</span>
              <p>{m.text}</p>
              <span className="msg-time">
                {new Date(m.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}

      {msgs.length === 0 && claim.status === "pending" && (
        <p className="msg-waiting">⏳ Таны хүсэлтийг хянаж байна. Удахгүй хариу өгнө.</p>
      )}

      <form className="msg-reply-form" onSubmit={send}>
        <input
          className="msg-reply-input"
          placeholder="Хариу бичих..."
          value={reply}
          onChange={e => setReply(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="msg-send-btn"
          disabled={sending || !reply.trim()}
          title="Илгээх"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

export default function ClaimStatusModal({ onClose }) {
  const [contact, setContact] = useState("");
  const [claims,  setClaims]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const check = async (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setLoading(true);
    setErr("");
    setClaims(null);
    try {
      const res = await axios.get(`${API_URL}/claims/check?contact=${encodeURIComponent(contact.trim())}`);
      setClaims(res.data);
    } catch {
      setErr("Хүсэлт шалгахад алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSent = (claimId, newMessages) => {
    setClaims(prev => prev.map(c =>
      c._id === claimId ? { ...c, messages: newMessages } : c
    ));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="claim-status-modal">

        <div className="claim-status-header">
          <div className="claim-status-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h3>Хүсэлтийн хариу</h3>
            <p>Утасны дугаараа оруулж харилцана уу</p>
          </div>
          <button className="claim-status-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="claim-status-form" onSubmit={check}>
          <input
            className="claim-status-input"
            type="tel"
            placeholder="Утасны дугаар (жнэ: 86788622)"
            value={contact}
            onChange={e => setContact(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary claim-status-btn" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Уншиж байна...</>
              : "Шалгах"}
          </button>
        </form>

        {err && <p className="claim-status-err">{err}</p>}

        {claims !== null && (
          claims.length === 0 ? (
            <div className="empty-state" style={{ padding: "28px 0 8px" }}>
              <div className="empty-icon">📋</div>
              <h3>Хүсэлт олдсонгүй</h3>
              <p>Энэ дугаараар илгээсэн хүсэлт байхгүй байна</p>
            </div>
          ) : (
            <div className="claim-status-list">
              {claims.map(claim => {
                const s = STATUS_MAP[claim.status] || STATUS_MAP.pending;
                const img = claim.item?.image
                  ? (claim.item.image.startsWith("http") || claim.item.image.startsWith("data:") ? claim.item.image : `${BASE_URL}/uploads/${claim.item.image}`)
                  : FALLBACK;
                return (
                  <div key={claim._id} className={`claim-status-item csi-${claim.status}`}>
                    <div className="csi-top">
                      <img
                        src={img}
                        alt={claim.item?.title || ""}
                        onError={e => { e.target.src = FALLBACK; }}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="csi-title">{claim.item?.title || "—"}</div>
                        {claim.item?.location && (
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                            📍 {claim.item.location}
                          </div>
                        )}
                      </div>
                      <span className={`status-badge ${s.cls}`}>{s.icon} {s.label}</span>
                    </div>
                    <div className="csi-date">
                      {new Date(claim.createdAt).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })} — хүсэлт илгээгдсэн
                    </div>
                    <MessageThread claim={claim} onMessageSent={handleMessageSent} />
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>
    </div>
  );
}
