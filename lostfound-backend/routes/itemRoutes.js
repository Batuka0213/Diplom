const express = require("express");
const multer  = require("multer");
const router  = express.Router();
const ctrl    = require("../controllers/itemController");

/* ── Multer: buffer дотор хадгалж Cloudinary руу upload хийнэ ── */
const fileFilter = (_, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  allowed.test(file.mimetype) ? cb(null, true) : cb(new Error("Зөвхөн зураг файл зөвшөөрнө"));
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/* ── Routes ── */
router.get   ("/",             ctrl.getItems);
router.get   ("/stats",        ctrl.getStats);
router.post  ("/claim-search", ctrl.claimSearch);
router.post  ("/",             upload.single("image"), ctrl.createItem);
router.put   ("/:id/status",   ctrl.updateStatus);
router.delete("/:id",          ctrl.deleteItem);

/* ── Multer алдаа ── */
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Зураг 5MB-аас хэтэрч болохгүй" });
  if (err.message)                    return res.status(400).json({ message: err.message });
  next(err);
});

module.exports = router;
