const express = require("express");
const router = express.Router();
const BidController = require("../Controllers/Bid.controller");
const autJWT = require("../helpers/jwt_helper");

/* router.post("/create", autJWT.verifyAccessToken, BidController.create); */
router.get("/getall", autJWT.verifyAccessToken, BidController.getAll);
router.post("/getsubbid", /* autJWT.verifyAccessToken, */ BidController.getOne);

module.exports = router;
