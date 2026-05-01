import React, { useEffect } from "react";

function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Хаах">✕</button>
      <div className="lightbox-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt || ""} className="lightbox-img" />
      </div>
      <p className="lightbox-hint">ESC эсвэл гадна дарж хаана</p>
    </div>
  );
}

export default Lightbox;
