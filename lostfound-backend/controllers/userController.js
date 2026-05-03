const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// --------------------
// Register User
// --------------------
exports.registerUser = async (req, res) => {
  try {

    const { name, email, password, studentCode } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Энэ email аль хэдийн бүртгэгдсэн байна",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      studentCode,
      points: 0,
      authProvider: "local"
    });

    res.status(201).json({
      message: "User амжилттай бүртгэгдлээ",
      user,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};



// --------------------
// Login User (Gmail OR StudentCode)
// --------------------
exports.loginUser = async (req, res) => {
  try {

    const { email, password, studentCode } = req.body;

    let user;

    // gmail login
    if (email) {
      user = await User.findOne({ email });
    }

    // student code login
    if (studentCode) {
      user = await User.findOne({ studentCode });
    }

    if (!user) {
      return res.status(404).json({
        message: "User олдсонгүй"
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        message: "Нууц үг буруу"
      });
    }

    res.json({
      message: "Login амжилттай",
      user
    });

  } catch (err) {
    res.status(500).json(err);
  }
};



// --------------------
// 🔐 Google OAuth — ID token шалгах
// --------------------
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential олдсонгүй" });
    }

    // Google ID token баталгаажуулах
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Хэрэглэгч байгаа эсэхийг шалгах
    let user = await User.findOne({ email });

    if (user) {
      // Google ID шинэчлэх
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (picture && !user.picture) user.picture = picture;
        await user.save();
      }
    } else {
      // Шинэ хэрэглэгч үүсгэх
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        picture,
        authProvider: "google",
        points: 0,
      });
    }

    res.json({ message: "Google нэвтрэлт амжилттай", user });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Google баталгаажуулалт амжилтгүй болсон" });
  }
};



// --------------------
// Get All Users
// --------------------
exports.getUsers = async (req, res) => {
  try {

    const users = await User.find();
    res.json(users);

  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};



// --------------------
// ⭐ Leaderboard
// --------------------
exports.getLeaderboard = async (req, res) => {
  try {

    const users = await User.find()
      .sort({ points: -1 })
      .limit(10);

    res.json(users);

  } catch (err) {
    res.status(500).json(err);
  }
};



// --------------------
// ⭐ Add Points
// --------------------
exports.addPoints = async (req, res) => {
  try {

    const { userId, points } = req.body;

    await User.findByIdAndUpdate(
      userId,
      { $inc: { points: points } }
    );

    res.json({
      message: "Points нэмэгдлээ"
    });

  } catch (err) {
    res.status(500).json(err);
  }
};