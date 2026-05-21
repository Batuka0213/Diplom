const ChatMessage = require("../models/ChatMessage");

/* ─────────────────────────────────────────
   GET /api/chat/rooms   (admin only)
   Бүх чат өрөөнүүд + сүүлийн мессеж
───────────────────────────────────────── */
exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id:         "$room",
          lastMessage: { $first: "$$ROOT" },
          total:       { $sum: 1 },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);
    res.json(rooms);
  } catch (err) {
    console.error("[getRooms]", err.message);
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/chat/:room
   Тухайн өрөөний мессежүүд
───────────────────────────────────────── */
exports.getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ room: req.params.room })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
    res.json(messages);
  } catch (err) {
    console.error("[getMessages]", err.message);
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/chat
   Мессеж илгээх (user эсвэл admin)
───────────────────────────────────────── */
exports.sendMessage = async (req, res) => {
  try {
    const { room, sender, name, text } = req.body;

    if (!room?.trim() || !text?.trim() || !name?.trim())
      return res.status(400).json({ message: "room, name, text шаардлагатай" });

    if (!["user", "admin"].includes(sender))
      return res.status(400).json({ message: "sender: user эсвэл admin байх ёстой" });

    const msg = await ChatMessage.create({
      room:   room.trim(),
      sender,
      name:   name.trim(),
      text:   text.trim(),
    });

    const io = req.app.get("io");
    if (io) {
      io.to(room).emit("new_chat_message", msg);
      if (sender === "user") {
        io.to("admin_chat").emit("new_user_msg", { room, msg });
      }
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error("[sendMessage]", err.message);
    res.status(500).json({ message: "Мессеж илгээхэд алдаа гарлаа" });
  }
};
