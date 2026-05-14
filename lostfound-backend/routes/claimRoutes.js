const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/claimController");

router.post("/",                   ctrl.submitClaim);
router.get  ("/",                  ctrl.getClaims);
router.get  ("/check",             ctrl.checkClaims);
router.put  ("/:id/approve",       ctrl.approveClaim);
router.put  ("/:id/reject",        ctrl.rejectClaim);
router.post ("/:id/message",       ctrl.addMessage);
router.get  ("/item/:itemId",      ctrl.getItemClaimCount);

module.exports = router;
