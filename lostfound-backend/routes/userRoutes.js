const express             = require("express");
const router              = express.Router();
const ctrl                = require("../controllers/userController");
const { auth, adminOnly } = require("../middleware/auth");

router.post("/register",     ctrl.registerUser);      // public
router.post("/login",        ctrl.loginUser);         // public
router.post("/google-login", ctrl.googleLogin);       // public
router.get  ("/leaderboard", ctrl.getLeaderboard);    // public

router.post("/points",       auth, ctrl.addPoints);             // нэвтэрсэн хэрэглэгч
router.get  ("/",            auth, adminOnly, ctrl.getUsers);   // admin only

module.exports = router;
