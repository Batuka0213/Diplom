import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import MapPicker from "../components/MapPicker";

function AddItem() {
  const [form,       setForm]       = useState({ title: "", description: "", location: "", contact: "", type: "lost" });
  const [image,      setImage]      = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showMap,    setShowMap]    = useState(false);
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => { setImage(null); setPreview(null); };

  const handleMapSelect = (address) => {
    setForm(prev => ({ ...prev, location: address }));
    toast.success("📍 Байршил тэмдэглэгдлээ", { duration: 1500 });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading("Бүртгэж байна...");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (image) data.append("image", image);
      await axios.post("http://localhost:5000/api/items", data);
      toast.success("Амжилттай бүртгэгдлээ!", { id: tid });
      setTimeout(() => navigate("/lost"), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Алдаа гарлаа. Дахин оролдоно уу.", { id: tid });
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="add-item-page">
        <div className="form-card">
          <h2>Зүйл бүртгэх</h2>
          <p className="form-subtitle">Хаясан эсвэл олсон зүйлийн мэдээллийг оруулна уу</p>

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Төрөл</label>
              <select name="type" value={form.type} onChange={handle}>
                <option value="lost">🔴 Хаясан (Lost)</option>
                <option value="found">🟢 Олсон (Found)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Гарчиг</label>
              <input
                name="title"
                placeholder="Жишээ: Улаан туулайн зураг бүхий цүнх"
                value={form.title}
                onChange={handle}
                required
              />
            </div>

            <div className="form-group">
              <label>Тайлбар</label>
              <textarea
                name="description"
                placeholder="Дэлгэрэнгүй тайлбар: өнгө, хэмжээ, онцлог шинж..."
                value={form.description}
                onChange={handle}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Байршил</label>
                <input
                  name="location"
                  placeholder="Хаана олдсон / хаясан?"
                  value={form.location}
                  onChange={handle}
                />
              </div>
              <div className="form-group">
                <label>Холбоо барих</label>
                <input
                  name="contact"
                  placeholder="Утасны дугаар"
                  value={form.contact}
                  onChange={handle}
                />
              </div>
            </div>

            {/* Map picker toggle */}
            <div className="form-group">
              <button
                type="button"
                className="btn-map-toggle"
                onClick={() => setShowMap(v => !v)}
              >
                <span>{showMap ? "🗺️ Газрын зураг хаах" : "🗺️ Газрын зурагт байршил тэмдэглэх"}</span>
                <span className="map-toggle-arrow">{showMap ? "▲" : "▼"}</span>
              </button>
              {showMap && (
                <div style={{ marginTop: 10 }}>
                  <MapPicker onSelect={handleMapSelect} />
                </div>
              )}
            </div>

            {/* Image upload + preview */}
            <div className="form-group">
              <label>Зураг (заавал биш)</label>
              {preview ? (
                <div className="img-preview-wrap">
                  <img src={preview} className="img-preview" alt="preview" />
                  <button type="button" className="img-preview-remove" onClick={removeImage} title="Зураг хасах">✕</button>
                </div>
              ) : (
                <div className="upload-zone" onClick={() => document.getElementById("img-upload").click()}>
                  <input id="img-upload" type="file" accept="image/*" onChange={handleImage} />
                  <div className="upload-icon">📷</div>
                  <p>Зураг сонгохын тулд дарна уу</p>
                  <small>JPG, PNG — 5MB хүртэл</small>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "13px", marginTop: "4px" }}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Бүртгэж байна...</>
                : "✅ Бүртгэх"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddItem;
