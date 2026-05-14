const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

/* ─────────────────────────────────────────
   POST /api/users/register
───────────────────────────────────────── */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, studentCode } = req.body;

    if (!name?.trim())  return res.status(400).json({ message: "Нэр заавал шаардлагатай" });
    if (!email?.trim()) return res.status(400).json({ message: "Email заавал шаардлагатай" });
    if (!password)      return res.status(400).json({ message: "Нууц үг заавал шаардлагатай" });
    if (password.length < 6) return res.status(400).json({ message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Энэ email аль хэдийн бүртгэгдсэн байна" });

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      studentCode: studentCode || null,
      authProvider: "local",
    });

    const token = signToken(user);
    res.status(201).json({ message: "Амжилттай бүртгэгдлээ", user, token });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Энэ email аль хэдийн бүртгэгдсэн байна" });
    console.error("[register]", err.message);
    res.status(500).json({ message: "Бүртгэлийн үед алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/users/login
───────────────────────────────────────── */
exports.loginUser = async (req, res) => {
  try {
    const { email, password, studentCode } = req.body;

    let user;

    if (email) {
      user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    } else if (studentCode) {
      user = await User.findOne({ studentCode }).select("+password");
    } else {
      return res.status(400).json({ message: "Email эсвэл оюутны код шаардлагатай" });
    }

    if (!user) return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });

    /* bcrypt hash эсвэл plain-text (хуучин хэрэглэгч) хоёуланг зохицуулна */
    let valid = false;
    if (user.password?.startsWith("$2")) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      valid = user.password === password;
      if (valid) {
        user.password = password;   // дараагийн save-д pre-hook hash хийнэ
        await user.save();
      }
    }

    if (!valid) return res.status(401).json({ message: "Нууц үг буруу байна" });

    const token = signToken(user);
    res.json({ message: "Нэвтэрлээ", user, token });
  } catch (err) {
    console.error("[login]", err.message);
    res.status(500).json({ message: "Нэвтрэхэд алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/users/google-login
───────────────────────────────────────── */
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential олдсонгүй" });

    const ticket  = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.googleId) {
        user.googleId     = googleId;
        user.authProvider = "google";
        if (picture && !user.picture) user.picture = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name:         name || email.split("@")[0],
        email,
        googleId,
        picture,
        authProvider: "google",
      });
    }

    const token = signToken(user);
    res.json({ message: "Google нэвтрэлт амжилттай", user, token });
  } catch (err) {
    console.error("[googleLogin]", err.message);
    res.status(500).json({ message: "Google баталгаажуулалт амжилтгүй болсон" });
  }
};

/* ─────────────────────────────────────────
   GET /api/users
───────────────────────────────────────── */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    console.error("[getUsers]", err.message);
    res.status(500).json({ message: "Хэрэглэгчид авахад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   GET /api/users/leaderboard
───────────────────────────────────────── */
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ points: { $gt: 0 } })
      .select("name email picture points")
      .sort({ points: -1 })
      .limit(20)
      .lean();
    res.json(users);
  } catch (err) {
    console.error("[leaderboard]", err.message);
    res.status(500).json({ message: "Leaderboard авахад алдаа гарлаа" });
  }
};

/* ─────────────────────────────────────────
   POST /api/users/points
───────────────────────────────────────── */
exports.addPoints = async (req, res) => {
  try {
    const { userId, points } = req.body;
    if (!userId || typeof points !== "number")
      return res.status(400).json({ message: "userId болон points шаардлагатай" });

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { points: Math.max(0, points) } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });

    res.json({ message: "Оноо нэмэгдлээ", points: user.points });
  } catch (err) {
    console.error("[addPoints]", err.message);
    res.status(500).json({ message: "Оноо нэмэхэд алдаа гарлаа" });
  }
};
