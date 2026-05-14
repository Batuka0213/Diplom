const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    item: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Item",
      required: true,
      index:    true,
    },

    claimantName: {
      type:     String,
      required: [true, "Нэр шаардлагатай"],
      trim:     true,
    },

    claimantContact: {
      type:     String,
      required: [true, "Холбоо барих шаардлагатай"],
      trim:     true,
    },

    proofText: {
      type:      String,
      required:  [true, "Нотолгооны тайлбар шаардлагатай"],
      minlength: [20, "Нотолгоо хамгийн багадаа 20 тэмдэгт байх ёстой"],
      trim:      true,
    },

    status: {
      type:    String,
      enum:    ["pending", "approved", "rejected"],
      default: "pending",
      index:   true,
    },

    adminNote: {
      type:    String,
      default: "",
    },

    messages: [
      {
        sender:    { type: String, enum: ["user", "admin"], required: true },
        text:      { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
