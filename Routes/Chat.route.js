const express = require("express");
const router = express.Router();
const autJWT = require("../helpers/jwt_helper");
const ChatController = require("../Controllers/Chat.controller");

router.post("/create", autJWT.verifyAccessToken, ChatController.createChat);
router.get("/getall", autJWT.verifyAccessToken, ChatController.getChats);
router.get("/deleteAll", /* autJWT.verifyAccessToken, */ ChatController.deleteAllChats);

module.exports = router;