const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    room:   { type: String, required: true, index: true }, // user_<phone>
    sender: { type: String, enum: ["user", "admin"], required: true },
    name:   { type: String, required: true, trim: true },
    text:   { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
