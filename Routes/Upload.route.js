const express = require("express");
const router = express.Router();
const uploadController = require("../Controllers/Upload.controller");

const fs = require("fs");
const multer = require('multer');
const DIR = './uploads/';

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(DIR + req.body.project_id);
        !fs.existsSync(DIR + req.body.project_id) && fs.mkdirSync(DIR + req.body.project_id);
        cb(null, DIR + req.body.project_id)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var upload = multer({ storage: storage })

router.post("/savedocuments", upload.array('docs'), uploadController.savefiles);
router.get("/document",  /* autJWT.verifyToken, */ uploadController.getFile);
router.post(
  "/documents",
  /* autJWT.verifyToken, */ uploadController.getAllBidFiles
);
router.delete("/deldocument", /* autJWT.verifyToken, */ uploadController.deleteFile);

module.exports = router;
