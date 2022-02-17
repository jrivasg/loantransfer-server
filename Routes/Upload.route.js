const express = require("express");
const router = express.Router();
const uploadController = require("../Controllers/Upload.controller");

const fs = require("fs");
const multer = require("multer");
const DIR = "./uploads/";

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //console.log(DIR + req.body.bid_id);
    const { bid_id, subbid_id, chat_id } = req.body;
    const directory = subbid_id ? subbid_id : bid_id ? bid_id : chat_id;
    !fs.existsSync(DIR + directory) && fs.mkdirSync(DIR + directory);
    cb(null, DIR + directory);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });

router.post("/savedocuments", upload.array("docs"), uploadController.savefiles);
router.get("/document", uploadController.getFile);
router.post("/getAll", uploadController.getAllBidFiles);
//router.delete("/deldocument", /* autJWT.verifyToken, */ uploadController.deleteFile);

module.exports = router;
