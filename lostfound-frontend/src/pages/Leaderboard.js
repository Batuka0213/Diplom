import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const MEDALS  = ["🥇", "🥈", "🥉"];
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const QUICK   = [5, 10, 25, 50];

const AVATAR_FALLBACK = (name = "?") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=80`;

/* ── DonateModal ─────────────────────────────────────────── */
function DonateModal({ recipient, myPoints, token, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(null); // { newPoints }

  const amt   = parseInt(amount, 10) || 0;
  const valid = amt >= 1 && amt <= myPoints;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/donations`,
        { toId: recipient._id, amount: amt, message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDone({ newPoints: res.data.newPoints });
      onSuccess(recipient._id, amt);
    } catch (err) {
      setError(err.response?.data?.message || "Донейт илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="donate-modal">

        <button className="donate-close" onClick={onClose} aria-label="Хаах">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="donate-header">
          <div className="donate-header-icon">💝</div>
          <h2>Оноо дамжуулах</h2>
          <p>Шилдэг хэрэглэгчийг урамшуулаарай</p>
        </div>

        {done ? (
          <div className="donate-success">
            <div className="donate-success-anim">🎉</div>
            <h3>Амжилттай!</h3>
            <p>
              <strong>{recipient.name}</strong>-д{" "}
              <span className="donate-highlight">{amt} ⭐</span> оноо илгээлээ!
            </p>
            <p className="donate-balance-after">
              Таны үлдэгдэл оноо: <strong>{done.newPoints} ⭐</strong>
            </p>
            <button className="donate-btn-primary" onClick={onClose} style={{ marginTop: 20 }}>
              Хаах
            </button>
          </div>
        ) : (
          <>
            <div className="donate-recipient">
              <img
                src={recipient.picture || AVATAR_FALLBACK(recipient.name)}
                alt={recipient.name}
                onError={e => { e.target.src = AVATAR_FALLBACK(recipient.name); }}
              />
              <div>
                <div className="donate-recip-name">{recipient.name}</div>
                <div className="donate-recip-pts">⭐ {recipient.points} оноотой</div>
              </div>
            </div>

            <div className="donate-my-balance">
              Таны оноо: <strong>{myPoints} ⭐</strong>
            </div>

            {error && <div className="alert alert-error donate-error">⚠️ {error}</div>}

            <form onSubmit={submit} className="donate-form">
              <label className="donate-label">Хэдэн оноо дамжуулах вэ?</label>

              <div className="donate-quick-row">
                {QUICK.map(q => (
                  <button
                    key={q}
                    type="button"
                    className={`donate-quick${amt === q ? " active" : ""}${q > myPoints ? " disabled" : ""}`}
                    disabled={q > myPoints}
                    onClick={() => setAmount(String(q))}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <input
                className="donate-input"
                type="number"
                min={1}
                max={myPoints}
                placeholder={`1 – ${myPoints}`}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              {amount && !valid && (
                <span className="donate-warn">
                  {amt < 1 ? "Хамгийн багадаа 1 оноо" : `Оноо хүрэлцэхгүй (max ${myPoints})`}
                </span>
              )}

              <label className="donate-label" style={{ marginTop: 14 }}>
                Мессеж <span style={{ color: "var(--muted)", fontWeight: 400 }}>(заавал биш)</span>
              </label>
              <textarea
                className="donate-textarea"
                rows={2}
                maxLength={100}
                placeholder="Баярлалаа, үргэлжлүүл! 👏"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />

              <button
                type="submit"
                className="donate-btn-primary"
                disabled={loading || !valid}
              >
                {loading
                  ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, display: "inline-block" }} /> Илгээж байна...</>
                  : <>💝 {amt > 0 ? `${amt} оноо ` : ""}дамжуулах</>
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Leaderboard ─────────────────────────────────────────── */
function Leaderboard() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [myPoints,  setMyPoints]  = useState(0);
  const [target,    setTarget]    = useState(null);  // recipient for donate modal

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const token       = localStorage.getItem("token");
  const isLoggedIn  = !!(currentUser && token);

  useEffect(() => {
    axios.get(`${API_URL}/users/leaderboard`)
      .then(res => setUsers(res.data))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get(`${API_URL}/donations/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setMyPoints(res.data.points || 0))
      .catch(() => {});
  }, [isLoggedIn, token]);

  const handleSuccess = useCallback((toId, amt) => {
    setUsers(prev => prev.map(u =>
      u._id === toId ? { ...u, points: u.points + amt } : u
    ).sort((a, b) => b.points - a.points));
    setMyPoints(p => p - amt);
  }, []);

  return (
    <div>
      <Navbar />
      <div className="page-container">

        <div className="page-header">
          <h1>🏆 Шилдэг хэрэглэгчид</h1>
          <p>Хамгийн идэвхтэй хэрэглэгчдийн жагсаалт — оноо дамжуулж урамшуулаарай</p>
          {isLoggedIn && (
            <div className="my-points-badge">
              Таны оноо: <strong>{myPoints} ⭐</strong>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Ачаалж байна...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>Мэдээлэл байхгүй байна</h3>
            <p>Хэрэглэгчид идэвхтэй оролцоно уу</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {users.map((u, i) => {
              const isMe = currentUser && (u._id === currentUser._id || u._id === currentUser.id);
              return (
                <div
                  className={`leader-card${i < 3 ? ` rank-${i + 1}` : ""}${isMe ? " leader-card-me" : ""}`}
                  key={u._id}
                >
                  <div className="leader-rank">
                    {MEDALS[i] ?? `#${i + 1}`}
                  </div>

                  <img
                    className="leader-avatar"
                    src={u.picture || AVATAR_FALLBACK(u.name)}
                    alt={u.name}
                    onError={e => { e.target.src = AVATAR_FALLBACK(u.name); }}
                  />

                  <div className="leader-info">
                    <div className="leader-name">
                      {u.name || "Хэрэглэгч"}
                      {isMe && <span className="leader-me-tag">Та</span>}
                    </div>
                    <div className="leader-sub">{u.email || ""}</div>
                  </div>

                  <div className="leader-right">
                    <div className="leader-points">⭐ {u.points}</div>
                    {isLoggedIn && !isMe && (
                      <button
                        className="leader-donate-btn"
                        onClick={() => setTarget(u)}
                        disabled={myPoints < 1}
                        title={myPoints < 1 ? "Оноо хүрэлцэхгүй" : `${u.name}-д оноо дамжуулах`}
                      >
                        💝 Донейт
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoggedIn && users.length > 0 && (
          <p className="leaderboard-login-hint">
            💡 Донейт хийхийн тулд <a href="/login">нэвтэрнэ үү</a>
          </p>
        )}

      </div>

      {target && (
        <DonateModal
          recipient={target}
          myPoints={myPoints}
          token={token}
          onClose={() => setTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default Leaderboard;
