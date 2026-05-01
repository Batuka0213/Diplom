import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const MEDALS = ["🥇", "🥈", "🥉"];

function Leaderboard() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/api/users/leaderboard")
      .then(res => setUsers(res.data))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <div className="page-container">

        <div className="page-header">
          <h1>🏆 Шилдэг хэрэглэгчид</h1>
          <p>Хамгийн идэвхтэй хэрэглэгчдийн жагсаалт</p>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Ачаалж байна...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>Мэдээлэл байхгүй байна</h3>
            <p>Хэрэглэгчид идэвхтэй оролцоно уу</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {users.map((u, i) => (
              <div
                className={`leader-card${i < 3 ? ` rank-${i + 1}` : ""}`}
                key={u._id}
              >
                <div className="leader-rank">
                  {MEDALS[i] ?? `#${i + 1}`}
                </div>
                <div className="leader-info">
                  <div className="leader-name">{u.name || "Хэрэглэгч"}</div>
                  <div className="leader-sub">{u.email || ""}</div>
                </div>
                <div className="leader-points">⭐ {u.points}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Leaderboard;
