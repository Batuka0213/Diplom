const mongoose = require("mongoose");

const COLORS = { green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", reset: "\x1b[0m", cyan: "\x1b[36m" };
const tag = (c, t) => `${COLORS[c]}${t}${COLORS.reset}`;

mongoose.connection.on("connected",    () => console.log(tag("green",  "  ✔ MongoDB — холбогдлоо")));
mongoose.connection.on("disconnected", () => console.log(tag("yellow", "  ⚠ MongoDB — салсан, дахин холбоно...")));
mongoose.connection.on("error",   err  => console.log(tag("red",    `  ✘ MongoDB алдаа: ${err.message}`)));

const connectDB = async () => {
  const opts = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:         45000,
    maxPoolSize:             10,
  };

  let attempts = 0;
  while (attempts < 5) {
    try {
      await mongoose.connect(process.env.MONGO_URI, opts);
      return;
    } catch (err) {
      attempts++;
      console.log(tag("yellow", `  ↺ MongoDB холбох оролдлого ${attempts}/5...`));
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error(tag("red", "  ✘ MongoDB холбогдож чадсангүй. Server зогсоно."));
  process.exit(1);
};

module.exports = connectDB;
