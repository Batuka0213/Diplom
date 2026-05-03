import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [form,    setForm]    = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showGmail, setShowGmail] = useState(false);
  const [gmailAddr, setGmailAddr] = useState("");
  const [gmailName, setGmailName] = useState("");
  const [gmailLoading, setGmailLoading] = useState(false);
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/users/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Бүртгэлийн алдаа гарлаа");
    }
    setLoading(false);
  };

  const handleGmailRegister = async (e) => {
    e.preventDefault();
    if (!gmailAddr.trim()) return;
    setGmailLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/users/google-login", {
        email: gmailAddr.trim(),
        name: gmailName.trim() || gmailAddr.split("@")[0],
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate(res.data.user.role === "admin" ? "/admin" : "/home");
    } catch (err) {
      setError(err.response?.data?.message || "Gmail бүртгэл амжилтгүй");
    }
    setGmailLoading(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={register}>

        <div className="auth-logo">
          <div className="logo-icon">🔍</div>
          <span>Lost&amp;Found</span>
        </div>

        <h2>Бүртгүүлэх</h2>
        <p className="auth-sub">Шинэ бүртгэл үүсгэх</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Gmail бүртгүүлэх товч */}
        {!showGmail ? (
          <button
            type="button"
            className="gmail-login-btn"
            onClick={() => setShowGmail(true)}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google-ээр бүртгүүлэх
          </button>
        ) : (
          <div className="gmail-form">
            <div className="gmail-form-header">
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Google-ээр бүртгүүлэх</span>
            </div>
            <div className="form-group">
              <label>Gmail хаяг</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={gmailAddr}
                onChange={e => setGmailAddr(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Нэр</label>
              <input
                type="text"
                placeholder="Таны нэр"
                value={gmailName}
                onChange={e => setGmailName(e.target.value)}
              />
            </div>
            <div className="gmail-form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setShowGmail(false); setError(""); }}
                style={{ flex: 1 }}
              >
                Буцах
              </button>
              <button
                type="button"
                className="gmail-submit-btn"
                onClick={handleGmailRegister}
                disabled={gmailLoading || !gmailAddr.trim()}
                style={{ flex: 1 }}
              >
                {gmailLoading ? (
                  <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Бүртгэж байна...</>
                ) : "Бүртгүүлэх"}
              </button>
            </div>
          </div>
        )}

        <div className="auth-divider">
          <span>эсвэл</span>
        </div>

        <div className="form-group">
          <label>Нэр</label>
          <input
            name="name"
            placeholder="Таны нэр"
            value={form.name}
            onChange={handle}
            required
          />
        </div>

        <div className="form-group">
          <label>И-мэйл</label>
          <input
            name="email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={handle}
            required
          />
        </div>

        <div className="form-group">
          <label>Нууц үг</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handle}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "8px", padding: "12px" }}
          disabled={loading}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Бүртгэж байна...</>
          ) : "Бүртгүүлэх"}
        </button>

        <p className="auth-footer">
          Бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link>
        </p>

      </form>
    </div>
  );
}

export default Register;
