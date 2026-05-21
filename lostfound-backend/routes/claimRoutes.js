const express              = require("express");
const router               = express.Router();
const ctrl                 = require("../controllers/claimController");
const { auth, adminOnly }  = require("../middleware/auth");

router.post("/",               ctrl.submitClaim);       // public — хэн ч хүсэлт гаргаж болно
router.get  ("/check",         ctrl.checkClaims);       // public — утасны дугаараар шалгана
router.get  ("/item/:itemId",  ctrl.getItemClaimCount); // public

router.get  ("/",              auth, adminOnly, ctrl.getClaims);       // admin only
router.put  ("/:id/approve",   auth, adminOnly, ctrl.approveClaim);    // admin only
router.put  ("/:id/reject",    auth, adminOnly, ctrl.rejectClaim);     // admin only
router.post ("/:id/message",   ctrl.addMessage);        // user + admin хоёул илгээж болно

module.exports = router;
