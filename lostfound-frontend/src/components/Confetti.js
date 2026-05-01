import React, { useEffect, useState } from "react";

const COLORS = ["#6366f1","#a78bfa","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#fbbf24"];
const SHAPES = ["square","circle","rect"];

function Confetti({ active, onDone }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) return;
    const items = Array.from({ length: 70 }, (_, i) => ({
      id:       i,
      x:        Math.random() * 100,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      size:     5 + Math.random() * 9,
      delay:    Math.random() * 0.8,
      duration: 1.6 + Math.random() * 1.2,
      rotation: Math.random() * 360,
      shape:    SHAPES[Math.floor(Math.random() * SHAPES.length)],
      drift:    (Math.random() - 0.5) * 120,
    }));
    setPieces(items);
    const t = setTimeout(() => { setPieces([]); onDone?.(); }, 3200);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (!pieces.length) return null;

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left:              `${p.x}%`,
            width:             p.shape === "rect" ? p.size * 2.2 : p.size,
            height:            p.shape === "rect" ? p.size * 0.45 : p.size,
            background:        p.color,
            borderRadius:      p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "1px",
            animationDelay:    `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--drift":         `${p.drift}px`,
            transform:         `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;
