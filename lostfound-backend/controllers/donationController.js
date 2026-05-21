const Donation = require("../models/Donation");
const User     = require("../models/User");

/* ─────────────────────────────────────────
   GET /api/donations/me
   Нэвтэрсэн хэрэглэгчийн одоогийн оноо
───────────────────────────────────────── */
exports.getMyPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name points picture").lean();
    if (!user) return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    res.json(user);
  } catch (err) {
    console.error("[getMyPoints]", err.message);
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/donations
   Оноо дамжуулах (donate)
───────────────────────────────────────── */
exports.sendDonation = async (req, res) => {
  try {
    const fromId = req.user.id;
    const { toId, amount, message } = req.body;

    if (!toId || !amount)
      return res.status(400).json({ message: "toId болон amount шаардлагатай" });

    if (String(fromId) === String(toId))
      return res.status(400).json({ message: "Өөртөө донейт хийх боломжгүй" });

    const amt = parseInt(amount, 10);
    if (!amt || amt < 1)
      return res.status(400).json({ message: "Дүн хамгийн багадаа 1 байх ёстой" });

    const [from, to] = await Promise.all([
      User.findById(fromId),
      User.findById(toId),
    ]);

    if (!from) return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    if (!to)   return res.status(404).json({ message: "Хүлээн авагч олдсонгүй" });

    if (from.points < amt)
      return res.status(400).json({
        message: `Оноо хүрэлцэхгүй байна (таны оноо: ${from.points})`,
      });

    await Promise.all([
      User.findByIdAndUpdate(fromId, { $inc: { points: -amt } }),
      User.findByIdAndUpdate(toId,   { $inc: { points:  amt } }),
    ]);

    const donation = await Donation.create({
      from:    fromId,
      to:      toId,
      amount:  amt,
      message: message?.trim() || "",
    });

    res.status(201).json({
      message:   `${to.name}-д ${amt} ⭐ оноо илгээлээ!`,
      donation,
      newPoints: from.points - amt,
    });
  } catch (err) {
    console.error("[sendDonation]", err.message);
    res.status(500).json({ message: "Донейт илгээхэд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/donations/admin-give
   Admin: хэрэглэгчид шагнал оноо өгөх (өөрийн оноонд нөлөөлөхгүй)
───────────────────────────────────────── */
exports.adminGive = async (req, res) => {
  try {
    const { toId, amount, message } = req.body;

    if (!toId || !amount)
      return res.status(400).json({ message: "toId болон amount шаардлагатай" });

    const amt = parseInt(amount, 10);
    if (!amt || amt < 1)
      return res.status(400).json({ message: "Дүн хамгийн багадаа 1 байх ёстой" });

    const to = await User.findByIdAndUpdate(
      toId,
      { $inc: { points: amt } },
      { new: true }
    ).select("name points");

    if (!to) return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });

    await Donation.create({
      from:    req.user.id,
      to:      toId,
      amount:  amt,
      message: message?.trim() || "Админаас шагнал",
    });

    res.json({ message: `${to.name}-д ${amt} ⭐ оноо олгогдлоо`, points: to.points });
  } catch (err) {
    console.error("[adminGive]", err.message);
    res.status(500).json({ message: "Оноо өгөхөд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/donations/received/:userId
   Хэрэглэгчид ирсэн донейтын түүх
───────────────────────────────────────── */
exports.getReceived = async (req, res) => {
  try {
    const donations = await Donation.find({ to: req.params.userId })
      .populate("from", "name picture")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(donations);
  } catch (err) {
    console.error("[getReceived]", err.message);
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};
