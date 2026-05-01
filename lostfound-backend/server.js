const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// MongoDB холболт
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// 📁 uploads folder serve
app.use("/uploads", express.static("uploads"));

// Routes import
const userRoutes = require("./routes/userRoutes");
const itemRoutes = require("./routes/itemRoutes");

// Routes ашиглах
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API ажиллаж байна");
});

// ❗ Error handling (optional but сайн)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

// Server start
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

const User = require("./models/User");

const createAdmin = async () => {

const admin = await User.findOne({ email:"admin@gmail.com" });

if(!admin){

await User.create({
name:"Admin",
email:"admin@gmail.com",
password:"123456",
role:"admin"
});

console.log("Admin created");
}

};

createAdmin();

});