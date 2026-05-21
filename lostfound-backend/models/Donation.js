const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    from:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount:  { type: Number, required: true, min: 1 },
    message: { type: String, default: "", maxlength: 200, trim: true },
  },
  { timestamps: true }
);

donationSchema.index({ to: 1, createdAt: -1 });
donationSchema.index({ from: 1, createdAt: -1 });

module.exports = mongoose.model("Donation", donationSchema);
