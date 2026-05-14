const Item       = require("../models/Item");
const cloudinary = require("../config/cloudinary");

/* ─────────────────────────────────────────
   GET /api/items
   Query: ?type=lost|found  &status=pending|returned  &category=...  &q=...
───────────────────────────────────────── */
exports.getItems = async (req, res) => {
  try {
    const { type, status, category, q } = req.query;
    const filter = {};

    if (type)     filter.type     = type;
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (q) {
      const re = new RegExp(q.trim(), "i");
      filter.$or = [{ title: re }, { description: re }, { location: re }];
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error("[getItems]", err.message);
    res.status(500).json({ message: "Мэдээлэл авахад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/items
───────────────────────────────────────── */
exports.createItem = async (req, res) => {
  try {
    const { title, description, location, type, contact, category } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Гарчиг заавал шаардлагатай" });
    if (!type)          return res.status(400).json({ message: "Төрөл заавал шаардлагатай" });

    let imageUrl = "";
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "lostfound", resource_type: "image" },
          (error, result) => error ? reject(error) : resolve(result.secure_url)
        );
        stream.end(req.file.buffer);
      });
    }

    const item = await Item.create({
      title:       title.trim(),
      description: description?.trim() || "",
      location:    location?.trim()    || "",
      type,
      contact:     contact?.trim()     || "",
      category:    category            || "",
      image:       imageUrl,
    });

    res.status(201).json(item);
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0]?.message || "Оролт буруу байна";
      return res.status(400).json({ message: msg });
    }
    console.error("[createItem]", err.message);
    res.status(500).json({ message: "Бүртгэхэд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   DELETE /api/items/:id
───────────────────────────────────────── */
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Зүйл олдсонгүй" });
    res.json({ message: "Амжилттай устгагдлаа", id: req.params.id });
  } catch (err) {
    console.error("[deleteItem]", err.message);
    res.status(500).json({ message: "Устгахад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   PUT /api/items/:id/status
───────────────────────────────────────── */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "returned"].includes(status))
      return res.status(400).json({ message: "Status: pending эсвэл returned байх ёстой" });

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Зүйл олдсонгүй" });

    res.json(item);
  } catch (err) {
    console.error("[updateStatus]", err.message);
    res.status(500).json({ message: "Статус шинэчлэхэд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/items/claim-search
   Keyword + TF-IDF-style weighted scoring
───────────────────────────────────────── */
exports.claimSearch = async (req, res) => {
  try {
    const { description = "", lostDate, category } = req.body;

    const tokens = description
      .toLowerCase()
      .replace(/[^\w\sа-яөүёА-ЯӨҮЁ]/gu, " ")
      .split(/\s+/)
      .filter(w => w.length > 1);

    if (!tokens.length)
      return res.status(400).json({ message: "Хайлтын тайлбар хоосон байна" });

    const filter = { type: "found", status: "pending" };
    if (lostDate) filter.createdAt = { $gte: new Date(lostDate) };
    if (category) filter.category  = category;

    const candidates = await Item.find(filter).sort({ createdAt: -1 }).lean();

    const scored = candidates
      .map(item => {
        const titleWeight  = 3;
        const descWeight   = 1.5;
        const locWeight    = 1;

        const titleTokens = (item.title       || "").toLowerCase().split(/\s+/);
        const descTokens  = (item.description || "").toLowerCase().split(/\s+/);
        const locTokens   = (item.location    || "").toLowerCase().split(/\s+/);

        let raw = 0;
        for (const kw of tokens) {
          if (titleTokens.some(t => t.includes(kw))) raw += titleWeight;
          if (descTokens .some(t => t.includes(kw))) raw += descWeight;
          if (locTokens  .some(t => t.includes(kw))) raw += locWeight;
        }

        const maxPossible = tokens.length * (titleWeight + descWeight + locWeight);
        const score       = raw / maxPossible;

        return { ...item, score };
      })
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json(scored);
  } catch (err) {
    console.error("[claimSearch]", err.message);
    res.status(500).json({ message: "Хайлтад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/items/stats
   Dashboard тоо баримт
───────────────────────────────────────── */
exports.getStats = async (req, res) => {
  try {
    const [total, lost, found, returned] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ type: "lost",  status: "pending"  }),
      Item.countDocuments({ type: "found", status: "pending"  }),
      Item.countDocuments({               status: "returned"  }),
    ]);

    res.json({ total, lost, found, returned, matchRate: total ? Math.round((returned / total) * 100) : 0 });
  } catch (err) {
    console.error("[getStats]", err.message);
    res.status(500).json({ message: "Статистик авахад алдаа гарлаа" });
  }
};
