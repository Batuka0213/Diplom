const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/userController");

router.post("/register",     ctrl.registerUser);
router.post("/login",        ctrl.loginUser);
router.post("/google-login", ctrl.googleLogin);
router.post("/points",       ctrl.addPoints);
router.get  ("/leaderboard", ctrl.getLeaderboard);
router.get  ("/",            ctrl.getUsers);

module.exports = router;
