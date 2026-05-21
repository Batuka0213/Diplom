const Claim = require("../models/Claim");
const Item  = require("../models/Item");

/* ─────────────────────────────────────────
   POST /api/claims
   Эзэмшлийн хүсэлт илгээх
───────────────────────────────────────── */
exports.submitClaim = async (req, res) => {
  try {
    const { itemId, claimantName, claimantContact, proofText } = req.body;

    if (!itemId || !claimantName?.trim() || !claimantContact?.trim() || !proofText?.trim())
      return res.status(400).json({ message: "Бүх талбарыг бөглөнө үү" });

    if (proofText.trim().length < 20)
      return res.status(400).json({ message: "Нотолгоо хамгийн багадаа 20 тэмдэгт байх ёстой" });

    const item = await Item.findById(itemId);
    if (!item)
      return res.status(404).json({ message: "Зүйл олдсонгүй" });

    if (item.status === "returned")
      return res.status(400).json({ message: "Энэ зүйл аль хэдийн эзэндээ хүрсэн" });

    const existing = await Claim.findOne({ item: itemId, claimantContact, status: "pending" });
    if (existing)
      return res.status(409).json({ message: "Та энэ зүйлд аль хэдийн хүсэлт гаргасан байна" });

    const claim = await Claim.create({ item: itemId, claimantName, claimantContact, proofText });

    res.status(201).json({ message: "Хүсэлт амжилттай илгээгдлээ. Admin шалгаад холбогдоно.", claim });
  } catch (err) {
    console.error("[submitClaim]", err.message);
    res.status(500).json({ message: "Хүсэлт илгээхэд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/claims
   Admin: бүх хүсэлтүүд
───────────────────────────────────────── */
exports.getClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const claims = await Claim.find(filter)
      .populate("item", "title type location image contact")
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (err) {
    console.error("[getClaims]", err.message);
    res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   PUT /api/claims/:id/approve
   Admin: хүсэлт зөвшөөрөх
───────────────────────────────────────── */
exports.approveClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });

    const note = (req.body || {}).adminNote || "";
    claim.status    = "approved";
    claim.adminNote = note;
    if (note) claim.messages.push({ sender: "admin", text: note });
    await claim.save();

    await Item.findByIdAndUpdate(claim.item, { status: "returned" });

    res.json({ message: "Хүсэлт зөвшөөрөгдлөө. Зүйл эзэндээ хүрсэн гэж тэмдэглэгдлээ." });
  } catch (err) {
    console.error("[approveClaim]", err.message);
    res.status(500).json({ message: "Зөвшөөрөхөд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   PUT /api/claims/:id/reject
   Admin: хүсэлт татгалзах
───────────────────────────────────────── */
exports.rejectClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });

    const note = (req.body || {}).adminNote || "";
    claim.status    = "rejected";
    claim.adminNote = note;
    if (note) claim.messages.push({ sender: "admin", text: note });
    await claim.save();

    res.json({ message: "Хүсэлт татгалзагдлаа." });
  } catch (err) {
    console.error("[rejectClaim]", err.message);
    res.status(500).json({ message: "Татгалзахад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/claims/:id/message
   Мессеж нэмэх (user эсвэл admin)
───────────────────────────────────────── */
exports.addMessage = async (req, res) => {
  try {
    const { text, sender } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Мессеж хоосон байна" });
    if (!["user", "admin"].includes(sender))
      return res.status(400).json({ message: "Sender буруу байна" });

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });

    claim.messages.push({ sender, text: text.trim() });
    await claim.save();

    res.json({ messages: claim.messages });
  } catch (err) {
    console.error("[addMessage]", err.message);
    res.status(500).json({ message: "Мессеж илгээхэд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/claims/check?contact=...
   Хэрэглэгч өөрийн хүсэлтийн хариуг шалгах
───────────────────────────────────────── */
exports.checkClaims = async (req, res) => {
  try {
    const { contact } = req.query;
    if (!contact?.trim())
      return res.status(400).json({ message: "Утасны дугаар оруулна уу" });

    const claims = await Claim.find({ claimantContact: contact.trim() })
      .populate("item", "title type location image")
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (err) {
    console.error("[checkClaims]", err.message);
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/claims/item/:itemId
   Тухайн зүйлийн хүсэлтүүдийн тоо
───────────────────────────────────────── */
exports.getItemClaimCount = async (req, res) => {
  try {
    const count = await Claim.countDocuments({ item: req.params.itemId, status: "pending" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};
