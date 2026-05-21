import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import socket from "../socket";
import { useLang } from "../contexts/LangContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function ChatWidget() {
  const { t } = useLang();
  const chatT = t("chat");
  const [open,     setOpen]     = useState(false);
  const [step,     setStep]     = useState("info"); // "info" | "chat"
  const [name,     setName]     = useState(localStorage.getItem("chat_name")  || "");
  const [phone,    setPhone]    = useState(localStorage.getItem("chat_phone") || "");
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef = useRef(null);

  const room = phone ? `user_${phone.replace(/\D/g, "")}` : null;

  // Хадгалагдсан мэдээлэл байвал chat руу шууд орно
  useEffect(() => {
    if (localStorage.getItem("chat_name") && localStorage.getItem("chat_phone")) {
      setStep("chat");
    }
  }, []);


  // Chat нээлттэй бол socket room-д орж, мессежүүд татна
  useEffect(() => {
    if (!open || step !== "chat" || !room) return;

    axios.get(`${API_URL}/chat/${room}`)
      .then(res => setMessages(res.data))
      .catch(() => {});

    socket.emit("join_room", room);

    const handler = (msg) => {
      if (msg.sender !== "admin") return;
      setMessages(prev => [...prev, msg]);
      if (!open) setUnread(n => n + 1);
    };
    socket.on("new_chat_message", handler);

    return () => {
      socket.off("new_chat_message", handler);
      socket.emit("leave_room", room);
    };
  }, [open, step, room]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Нээлттэй бол unread тоо цэвэрлэх
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const startChat = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!name.trim() || cleanPhone.length < 8) return;
    localStorage.setItem("chat_name",  name.trim());
    localStorage.setItem("chat_phone", cleanPhone);
    setPhone(cleanPhone);
    setStep("chat");
  };

  const resetChat = () => {
    localStorage.removeItem("chat_name");
    localStorage.removeItem("chat_phone");
    setName("");
    setPhone("");
    setMessages([]);
    setStep("info");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !room || sending) return;
    const tempMsg = {
      _id: Date.now().toString(),
      room,
      sender: "user",
      name:   name || "Хэрэглэгч",
      text:   trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setText("");
    setSending(true);
    try {
      await axios.post(`${API_URL}/chat`, {
        room,
        sender: "user",
        name:   name || "Хэрэглэгч",
        text:   trimmed,
      });
    } catch {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      setText(trimmed);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <>
      {/* ── Chat window ── */}
      {open && (
        <div className="chat-widget" role="dialog" aria-label="Чат">

          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">🔍</div>
              <div>
                <div className="chat-title">{chatT.title}</div>
                <div className="chat-subtitle">
                  <span className="chat-online-dot" />
                  {step === "chat" ? (
                    <>
                      {name}
                      <button className="chat-reset-btn" onClick={resetChat} title="Мэдээлэл өөрчлөх">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </>
                  ) : chatT.online}
                </div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)} aria-label="Хаах">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          {step === "info" ? (
            /* ── Мэдээлэл оруулах хэлбэр ── */
            <div className="chat-info-body">
              <div className="chat-info-icon">💬</div>
              <p className="chat-info-text">{chatT.infoText}</p>

              <input
                className="chat-field"
                placeholder={chatT.namePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && startChat()}
              />
              <input
                className="chat-field"
                placeholder={chatT.phonePlaceholder}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                inputMode="tel"
                onKeyDown={e => e.key === "Enter" && startChat()}
              />

              <button
                className="chat-start-btn"
                onClick={startChat}
                disabled={!name.trim() || phone.replace(/\D/g, "").length < 8}
              >
                {chatT.startBtn}
              </button>
            </div>
          ) : (
            /* ── Мессежийн жагсаалт ── */
            <>
              <div className="chat-messages">
                {/* Тавтай морил мессеж */}
                <div className="chat-bubble admin">
                  <p>{chatT.welcome}</p>
                  <span className="chat-time">Lost&amp;Found</span>
                </div>

                {messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.sender}`}>
                    <p>{m.text}</p>
                    <span className="chat-time">
                      {m.sender === "admin" ? `${chatT.admin} · ` : ""}
                      {new Date(m.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                  className="chat-text-input"
                  placeholder={chatT.inputPlaceholder}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!text.trim() || sending}
                  aria-label="Илгээх"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ── Toggle button ── */}
      <button
        className={`chat-toggle-btn${open ? " open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Чат нээх / хаах"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="chat-unread-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
    </>
  );
}
