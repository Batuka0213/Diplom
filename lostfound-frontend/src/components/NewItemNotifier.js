import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import socket from "../socket";

export default function NewItemNotifier() {
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("new_item", (item) => {
      const isLost  = item.type === "lost";
      const emoji   = isLost ? "🔴" : "🟢";
      const label   = isLost ? "Шинэ хаясан зүйл" : "Шинэ олдсон зүйл";

      toast(
        (t) => (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => {
              toast.dismiss(t.id);
              navigate(`/item/${item._id}`);
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 3 }}>
              {emoji} {label}
            </div>
            <div style={{ fontSize: 13, color: "#475569" }}>
              {item.title}
              {item.location ? ` — ${item.location}` : ""}
            </div>
            <div style={{ fontSize: 11, color: "#6366f1", marginTop: 4 }}>
              Дарж дэлгэрэнгүй харах →
            </div>
          </div>
        ),
        {
          duration: 7000,
          icon:     "🔔",
          style:    { maxWidth: 320, cursor: "pointer" },
        }
      );
    });

    return () => {
      socket.off("new_item");
    };
  }, [navigate]);

  return null;
}
