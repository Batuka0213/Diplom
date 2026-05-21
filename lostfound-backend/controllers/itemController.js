const Item       = require("../models/Item");
const cloudinary = require("../config/cloudinary");

const isCloudinaryReady = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return (
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    CLOUDINARY_API_KEY    !== "your_api_key" &&
    CLOUDINARY_API_SECRET !== "your_api_secret"
  );
};

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
      if (isCloudinaryReady()) {
        imageUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "lostfound", resource_type: "image" },
            (error, result) => error ? reject(error) : resolve(result.secure_url)
          );
          stream.end(req.file.buffer);
        });
      } else {
        // Cloudinary тохиргоогүй үед base64 болгон MongoDB-д шууд хадгална
        // (Render-ийн ephemeral disk-т найдахгүй, ямар ч сервер дээр ажиллана)
        const mime   = req.file.mimetype || "image/jpeg";
        const b64    = req.file.buffer.toString("base64");
        imageUrl     = `data:${mime};base64,${b64}`;
      }
    }

    const item = await Item.create({
      title:       title.trim(),
      description: description?.trim() || "",
      location:    location?.trim()    || "",
      type,
      contact:     contact?.trim()     || "",
      category:    category            || "",
      image:       imageUrl,
      createdBy:   req.user?.id        || null,
    });

    // Бүх клиентэд шинэ зүйл нэмэгдсэн мэдэгдэл илгээх
    const io = req.app.get("io");
    if (io) io.emit("new_item", item);

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
   GET /api/items/:id
   Нэг item ID-аар авах
───────────────────────────────────────── */
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Зүйл олдсонгүй" });
    res.json(item);
  } catch (err) {
    console.error("[getItemById]", err.message);
    res.status(500).json({ message: "Мэдээлэл авахад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/items/:id/similar
   AI-тохирох зүйлс (keyword scoring)
───────────────────────────────────────── */
exports.getSimilarItems = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Зүйл олдсонгүй" });

    const oppositeType = item.type === "lost" ? "found" : "lost";
    const tokens = ((item.title || "") + " " + (item.description || ""))
      .toLowerCase()
      .replace(/[^\w\sа-яөүёА-ЯӨҮЁ]/gu, " ")
      .split(/\s+/)
      .filter(w => w.length > 1)
      .slice(0, 15);

    if (!tokens.length) return res.json([]);

    const filter = { type: oppositeType, status: "pending", _id: { $ne: item._id } };
    if (item.category) filter.category = item.category;

    const candidates = await Item.find(filter).sort({ createdAt: -1 }).limit(60).lean();

    const titleWeight = 3, descWeight = 1.5, locWeight = 1;
    const maxPossible = tokens.length * (titleWeight + descWeight + locWeight);

    const scored = candidates
      .map(c => {
        const titleToks = (c.title       || "").toLowerCase().split(/\s+/);
        const descToks  = (c.description || "").toLowerCase().split(/\s+/);
        const locToks   = (c.location    || "").toLowerCase().split(/\s+/);
        let raw = 0;
        for (const kw of tokens) {
          if (titleToks.some(t => t.includes(kw))) raw += titleWeight;
          if (descToks .some(t => t.includes(kw))) raw += descWeight;
          if (locToks  .some(t => t.includes(kw))) raw += locWeight;
        }
        return { ...c, score: maxPossible ? (raw / maxPossible) * 10 : 0 };
      })
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json(scored);
  } catch (err) {
    console.error("[getSimilarItems]", err.message);
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/items/fix-images  (admin only)
   Render local disk-д байсан эвдэрсэн зургуудыг цэвэрлэх
───────────────────────────────────────── */
exports.fixBrokenImages = async (req, res) => {
  try {
    // Зөвхөн http (Cloudinary) эсвэл data: (base64) биш бол эвдэрсэн гэж үзнэ
    const result = await Item.updateMany(
      {
        image: { $exists: true, $ne: "" },
        $nor: [
          { image: /^https?:\/\// },
          { image: /^data:/ },
        ],
      },
      { $set: { image: "" } }
    );
    res.json({ message: `${result.modifiedCount} зүйлийн эвдэрсэн зураг цэвэрлэгдлээ`, fixed: result.modifiedCount });
  } catch (err) {
    console.error("[fixBrokenImages]", err.message);
    res.status(500).json({ message: "Алдаа гарлаа" });
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
