const express = require("express");
const router = express.Router();
const UploadController = require("../Controllers/Upload.controller");

router.post("/", UploadController.upload);


module.exports = router;
