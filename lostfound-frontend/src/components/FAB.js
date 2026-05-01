import React from "react";
import { Link, useLocation } from "react-router-dom";

const HIDE_ON = ["/add", "/login", "/register", "/admin"];

function FAB() {
  const { pathname } = useLocation();
  if (HIDE_ON.includes(pathname)) return null;
  return (
    <Link to="/add" className="fab" aria-label="Зүйл нэмэх">
      <span className="fab-icon">+</span>
      <span className="fab-label">Нэмэх</span>
    </Link>
  );
}

export default FAB;
