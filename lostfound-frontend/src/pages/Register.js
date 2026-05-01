import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [form,    setForm]    = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
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
