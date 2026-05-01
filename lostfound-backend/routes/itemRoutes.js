const express = require("express");
const router = express.Router();
const multer = require("multer");

const itemController = require("../controllers/itemController");

const storage = multer.diskStorage({
destination:(req,file,cb)=>{
cb(null,"uploads/");
},
filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname);
}
});

const upload = multer({storage});

router.get("/", itemController.getItems);

router.post("/", upload.single("image"), itemController.createItem);

router.delete("/:id", itemController.deleteItem);

// ⭐ STATUS
router.put("/:id/status", itemController.updateStatus);

module.exports = router;