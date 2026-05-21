const express             = require("express");
const router              = express.Router();
const ctrl                = require("../controllers/chatController");
const { auth, adminOnly } = require("../middleware/auth");

router.get  ("/rooms",  auth, adminOnly, ctrl.getRooms);    // admin only
router.get  ("/:room",  ctrl.getMessages);                   // public
router.post ("/",       ctrl.sendMessage);                   // public

module.exports = router;
