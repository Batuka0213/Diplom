import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        <Link to="/home" className="footer-brand">
          <div className="brand-icon" style={{ width: 28, height: 28, fontSize: 13, borderRadius: 7 }}>🔍</div>
          Lost&amp;Found
        </Link>

        <p className="footer-copy">© {new Date().getFullYear()} Lost &amp; Found System. Монгол улс.</p>

        <div className="footer-links">
          <Link to="/lost">Хаясан</Link>
          <Link to="/found">Олдсон</Link>
          <Link to="/add">Нэмэх</Link>
          <Link to="/leaderboard">Шилдэг</Link>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
