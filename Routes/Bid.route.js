const express = require("express");
const router = express.Router();
const BidController = require("../Controllers/Bid.controller");
const AuthController = require("../Controllers/Auth.Controller")

router.post("/create", BidController.create);
router.get("/getall", AuthController.getAll);

module.exports = router;
