import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/users/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));
      navigate(res.data.user.role === "admin" ? "/admin" : "/home");
    } catch (err) {
      setError(err.response?.data?.message || "Нэвтрэх үед алдаа гарлаа");
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const res = await axios.post(`${API_URL}/users/google-login`, {
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));
      navigate(res.data.user.role === "admin" ? "/admin" : "/home");
    } catch (err) {
      setError(err.response?.data?.message || "Google нэвтрэлт амжилтгүй болсон");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={login}>

        <div className="auth-logo">
          <div className="logo-icon">🔍</div>
          <span>Lost&amp;Found</span>
        </div>

        <h2>Нэвтрэх</h2>
        <p className="auth-sub">Системд нэвтэрч ажиллаарай</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Жинхэнэ Google товч */}
        <div className="google-btn-wrap">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google нэвтрэлт амжилтгүй болсон")}
            useOneTap={false}
            width="100%"
            text="signin_with"
            shape="rectangular"
            logo_alignment="left"
            locale="mn"
          />
        </div>

        <div className="auth-divider"><span>эсвэл и-мэйлээр</span></div>

        <div className="form-group">
          <label>И-мэйл</label>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Нууц үг</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "8px", padding: "12px" }}
          disabled={loading}
        >
          {loading
            ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Түр хүлээнэ үү...</>
            : "Нэвтрэх"
          }
        </button>

        <p className="auth-footer">
          Бүртгэл байхгүй юу? <Link to="/register">Бүртгүүлэх</Link>
        </p>

      </form>
    </div>
  );
}

export default Login;
