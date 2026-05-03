import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home        from "./pages/Home";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import AddItem     from "./pages/AddItem";
import LostItems   from "./pages/LostItems";
import FoundItems  from "./pages/FoundItems";
import ItemDetail  from "./pages/ItemDetail";
import Admin       from "./pages/Admin";
import Leaderboard from "./pages/Leaderboard";
import Archive     from "./pages/Archive";
import SavedItems  from "./pages/SavedItems";
import NotFound    from "./pages/NotFound";

import Footer      from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import TopBar      from "./components/TopBar";
import FAB         from "./components/FAB";

import "./App.css";

function App() {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return (
    <Router>
      <TopBar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: "Inter, sans-serif", fontSize: 14 },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/home"        element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/admin"       element={<Admin />} />
        <Route path="/add"         element={<AddItem />} />
        <Route path="/lost"        element={<LostItems />} />
        <Route path="/found"       element={<FoundItems />} />
        <Route path="/item/:id"    element={<ItemDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/archive"     element={<Archive />} />
        <Route path="/saved"       element={<SavedItems />} />
        <Route path="*"            element={<NotFound />} />
      </Routes>
      <Footer />
      <ScrollToTop />
      <FAB />
    </Router>
  );
}

export default App;
