const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT шалгах middleware
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Authorization header: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Token байхгүй" });
    }

    // Token шалгах
    const decoded = jwt.verify(token, "secretkey");

    // хэрэглэгчийг database-ээс авах
    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token буруу эсвэл хугацаа дууссан" });
  }
};

module.exports = authMiddleware;