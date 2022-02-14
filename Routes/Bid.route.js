const express = require("express");
const router = express.Router();
const BidController = require("../Controllers/Bid.controller");
const autJWT = require("../helpers/jwt_helper");

/* router.post("/create", autJWT.verifyAccessToken, BidController.create); */
router.get("/getall", autJWT.verifyAccessToken, BidController.getAll);
router.get("/getactive", autJWT.verifyAccessToken, BidController.getActiveBids);
router.post("/getsubbid", autJWT.verifyAccessToken, BidController.getOneSubbid);
router.post("/getbid", /* autJWT.verifyAccessToken, */ BidController.getOneBid);
router.post("/create", /* autJWT.verifyAccessToken, */ BidController.createBid);
router.post("/delete", /* autJWT.verifyAccessToken, */ BidController.deleteBid);
router.get("/report", autJWT.verifyAccessToken, BidController.getReport);
// Lista sellers y ObjectId
router.get("/getinfo", autJWT.verifyAccessToken, BidController.getInfo);
router.get("/getsubbidid", autJWT.verifyAccessToken, BidController.getsubbidid);

module.exports = router;
