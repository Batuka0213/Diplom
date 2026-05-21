const express              = require("express");
const router               = express.Router();
const ctrl                 = require("../controllers/donationController");
const { auth, adminOnly }  = require("../middleware/auth");

router.get ("/me",               auth,            ctrl.getMyPoints);   // нэвтэрсэн хэрэглэгчийн оноо
router.post("/",                 auth,            ctrl.sendDonation);  // оноо дамжуулах
router.post("/admin-give",       auth, adminOnly, ctrl.adminGive);     // admin шагнал өгөх
router.get ("/received/:userId",                  ctrl.getReceived);   // хүлээн авсан түүх (public)

module.exports = router;
