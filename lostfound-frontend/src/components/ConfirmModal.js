import React, { useEffect } from "react";

function ConfirmModal({ isOpen, message, subMessage, onConfirm, onCancel, danger = true }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className={`modal-icon-wrap ${danger ? "danger" : "info"}`}>
          {danger ? "🗑" : "✅"}
        </div>
        <h3 className="modal-title">Баталгаажуулах</h3>
        <p className="modal-message">{message}</p>
        {subMessage && <p className="modal-sub">{subMessage}</p>}
        <div className="modal-actions">
          <button className="btn btn-outline modal-cancel" onClick={onCancel}>
            Болих
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"} modal-confirm`}
            onClick={onConfirm}
            autoFocus
          >
            {danger ? "Тийм, устгах" : "Тийм"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
