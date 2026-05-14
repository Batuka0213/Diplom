const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, "Гарчиг заавал шаардлагатай"],
      trim:      true,
      minlength: [2,  "Гарчиг хамгийн багадаа 2 тэмдэгт байх ёстой"],
      maxlength: [120,"Гарчиг 120-аас хэтэрч болохгүй"],
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: [2000, "Тайлбар 2000-аас хэтэрч болохгүй"],
      default:   "",
    },

    location: {
      type:  String,
      trim:  true,
      default: "",
    },

    type: {
      type:     String,
      enum:     { values: ["lost", "found"], message: "Төрөл: lost эсвэл found байх ёстой" },
      required: [true, "Төрөл заавал шаардлагатай"],
      index:    true,
    },

    category: {
      type:    String,
      enum:    ["phone","key","bag","card","glasses","jewelry","other",""],
      default: "",
      index:   true,
    },

    status: {
      type:    String,
      enum:    ["pending","returned"],
      default: "pending",
      index:   true,
    },

    image:   { type: String, default: "" },
    contact: { type: String, trim: true, default: "" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      default: null,
    },

    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

/* ── Индексүүд ── */
itemSchema.index({ type: 1, status: 1, createdAt: -1 });
itemSchema.index({ category: 1, type: 1 });
itemSchema.index({ title: "text", description: "text", location: "text" });

module.exports = mongoose.model("Item", itemSchema);
