import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function NotFound() {
  return (
    <div>
      <Navbar />
      <div className="notfound-page">
        <div className="notfound-icon">🔍</div>
        <h1 className="notfound-code">404</h1>
        <h2 className="notfound-title">Хуудас олдсонгүй</h2>
        <p className="notfound-sub">Таны хайсан хуудас байхгүй эсвэл шилжсэн байна.</p>
        <Link to="/home" className="btn btn-primary" style={{ padding: "12px 28px", fontSize: 15 }}>
          🏠 Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
