const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, "Нэр заавал шаардлагатай"],
      trim:      true,
      maxlength: [80, "Нэр 80-аас хэтэрч болохгүй"],
    },

    email: {
      type:      String,
      required:  [true, "Email заавал шаардлагатай"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, "Email буруу форматтай байна"],
    },

    password: {
      type:   String,
      default: null,
      select: false,   // default query-д нуусан байна
    },

    role: {
      type:    String,
      enum:    ["user", "admin"],
      default: "user",
    },

    points: {
      type:    Number,
      default: 0,
      min:     0,
    },

    googleId:     { type: String, default: null, sparse: true },
    picture:      { type: String, default: null },
    authProvider: { type: String, enum: ["local","google"], default: "local" },
    studentCode:  { type: String, default: null, sparse: true },
  },
  {
    timestamps: true,
  }
);

/* ── Индексүүд ── */
userSchema.index({ points: -1 });

/* ── Хадгалахаас өмнө нууц үг hash хийх ── */
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* ── Нууц үг шалгах method ── */
userSchema.methods.comparePassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

/* ── JSON-д нууц үг явуулахгүй ── */
userSchema.set("toJSON", {
  transform(_, obj) {
    delete obj.password;
    return obj;
  },
});

module.exports = mongoose.model("User", userSchema);
