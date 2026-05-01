const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");


// ============================
// AUTH
// ============================

// register
router.post("/register", userController.registerUser);

// login
router.post("/login", userController.loginUser);


// ============================
// USERS
// ============================

// get all users
router.get("/", userController.getUsers);


// ============================
// ⭐ LEADERBOARD
// ============================

router.get("/leaderboard", userController.getLeaderboard);


// ============================
// ⭐ ADD POINTS
// ============================

router.post("/points", userController.addPoints);



module.exports = router;