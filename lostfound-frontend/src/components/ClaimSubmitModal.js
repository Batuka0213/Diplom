import React, { useState } from "react";
import axios from "axios";

const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", "");
const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='150' y='95' width='100' height='82' rx='8' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='22' fill='none' stroke='%23d1d5db' stroke-width='3'/%3E%3Ccircle cx='200' cy='136' r='9' fill='%23d1d5db'/%3E%3Crect x='162' y='103' width='18' height='10' rx='3' fill='%23d1d5db'/%3E%3C/svg%3E";

const validatePhone = (val) => /^[0-9]{8}$/.test(val.replace(/[\s-]/g, ""));

export default function ClaimSubmitModal({ item, onClose, mode = "owner" }) {
  // mode: "owner" = Found item-д өөрийн эзэмшил нотлох
  //       "finder" = Lost item-г олсон гэж мэдэгдэх
  const isFinderMode = mode === "finder";
  const [name,    setName]    = useState("");
  const [contact, setContact] = useState("");
  const [proof,   setProof]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const imgSrc = item.image
    ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `${BASE_URL}/uploads/${item.image}`)
    : FALLBACK;

  const phoneOk = validatePhone(contact);

  const submit = async (e) => {
    e.preventDefault();
    if (proof.trim().length < 20) {
      setError("Нотолгоо хамгийн багадаа 20 тэмдэгт байх ёстой");
      return;
    }
    if (!phoneOk) {
      setError("Утасны дугаар 8 оронтой байх ёстой (жнэ: 99001234)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_URL}/claims`, {
        itemId:          item._id,
        claimantName:    name.trim(),
        claimantContact: contact.trim(),
        proofText:       proof.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Хүсэлт илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="claim-modal" style={{ maxWidth: 480 }}>

        <div className="claim-banner">
          <div className="claim-banner-glow" />
          <button className="claim-x" onClick={onClose} aria-label="Хаах">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Item preview inside header */}
          <div className="claim-banner-inner">
            <img
              src={imgSrc}
              alt={item.title}
              onError={e => { e.target.src = FALLBACK; }}
              style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.3)" }}
            />
            <div>
              <h2 className="claim-banner-title">
                {isFinderMode ? "Олдсон мэдэгдэл" : "Эзэмшлийн хүсэлт"}
              </h2>
              <p className="claim-banner-sub">
                {isFinderMode
                  ? `«${item.title}» — Та уг зүйлийг олсон гэдгийг нотолно уу`
                  : `«${item.title}» — Энэ миний зүйл гэдгийг нотолно уу`}
              </p>
            </div>
          </div>
        </div>

        <div className="claim-body">
          {done ? (
            <div className="claim-success">
              <div className="claim-success-icon">✅</div>
              <h3>Хүсэлт илгээгдлээ!</h3>
              <p>Таны хүсэлтийг admin шалгаад, <strong>{contact}</strong> дугаараар холбогдоно. Ойролцоогоор 1-2 ажлын өдөрт хариу өгнө.</p>
              <button className="claim-submit" onClick={onClose} style={{ marginTop: 16 }}>Хаах</button>
            </div>
          ) : (
            <form onSubmit={submit} className="claim-form">

              <div className="claim-hint">
                <span className="claim-hint-icon">🛡️</span>
                <span>
                  {isFinderMode
                    ? <>Та <strong>зүйлийг олсон байршил, байдал</strong>-г дэлгэрэнгүй бичнэ үү. Admin шалгаад эзэнтэй нь холбогдоно.</>
                    : <>Хуурамч хүсэлт гаргах нь хууль зөрчих явдал болно. Зөвхөн <strong>жинхэнэ эзэн л мэдэх</strong> нарийн мэдэгдлийг бичнэ үү.</>
                  }
                </span>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}

              <div className="claim-field">
                <label className="claim-label">Таны нэр <span className="req">*</span></label>
                <input
                  className="claim-date"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="Бүтэн нэрээ бичнэ үү"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="claim-field">
                <label className="claim-label">
                  Утасны дугаар <span className="req">*</span>
                  {contact && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: phoneOk ? "#10b981" : "#ef4444" }}>
                      {phoneOk ? "✓ Зөв" : "✗ 8 оронтой байх ёстой"}
                    </span>
                  )}
                </label>
                <input
                  className="claim-date"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderColor: contact && !phoneOk ? "#ef4444" : undefined,
                  }}
                  placeholder="Жишээ: 99001234"
                  value={contact}
                  onChange={e => setContact(e.target.value.replace(/[^\d\s-]/g, ""))}
                  inputMode="tel"
                  required
                />
              </div>

              <div className="claim-field">
                <div className="claim-label-row">
                  <label className="claim-label">
                    {isFinderMode ? "Олсон байршил, нөхцөл байдал" : "Зөвхөн эзэн л мэдэх нотолгоо"}
                    <span className="req"> *</span>
                  </label>
                  <span className={`claim-char ${proof.length > 250 ? "warn" : ""}`}>
                    {proof.length}/300
                  </span>
                </div>
                <textarea
                  className="claim-textarea"
                  rows={5}
                  maxLength={300}
                  placeholder={isFinderMode
                    ? "Жишээ:\n• Олсон байршил: Сүхбаатарын талбай, банкны орчим\n• Олсон цаг: Өчигдөр 14:00 орчим\n• Зүйлийн байдал: хаалттай цүнхэнд байсан\n• Холбоо барих аргаа бичнэ үү"
                    : "Жишээ:\n• Утасны серийн дугаар: IMEI 358...\n• Цүнхний дотор талд юу байсан (карт, түлхүүр г.м.)\n• Онцлог эвдрэл, зураас, өнгийн ялгаа\n• Зурагт дэлгэрэнгүй тайлбар"
                  }
                  value={proof}
                  onChange={e => setProof(e.target.value)}
                  required
                />
                <p className="claim-proof-hint">
                  ⚠️ Хэт ерөнхий мэдэгдэл (жишээ: "хар утас") хангалтгүй — баталгаажуулах боломжгүй.
                </p>
              </div>

              <button
                type="submit"
                className="claim-submit"
                disabled={loading || !name.trim() || !phoneOk || proof.trim().length < 20}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, display: "inline-block" }} /> Илгээж байна...</>
                ) : (
                  isFinderMode ? <>📬 Мэдэгдэл илгээх</> : <>🔐 Хүсэлт илгээх</>
                )}
              </button>

              <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
                Хуурамч мэдэгдэл гаргасан тохиолдолд хариуцлага хүлээнэ.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
