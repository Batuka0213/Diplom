const User = require("../models/User");


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
      points: 0
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