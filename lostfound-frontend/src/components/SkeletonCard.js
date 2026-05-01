import React from "react";

function SkeletonCard() {
  return (
    <div className="item-card" style={{ pointerEvents: "none" }}>
      <div className="skeleton skeleton-img" />
      <div className="card-body">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
        <div style={{ paddingTop: 10, borderTop: "1px solid var(--border)", marginTop: 8 }}>
          <div className="skeleton skeleton-line short" style={{ marginBottom: 4 }} />
          <div className="skeleton skeleton-line" style={{ width: "70%" }} />
        </div>
      </div>
      <div className="card-footer">
        <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default SkeletonCard;
