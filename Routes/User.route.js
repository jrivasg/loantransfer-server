const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/User.Controller");
const autJWT = require("../helpers/jwt_helper");

router.get("/acountinfo", autJWT.verifyAccessToken, UserController.getAccountInfo);
router.post(
  "/create",
  autJWT.verifyAccessToken,
  UserController.createUSer
);

module.exports = router;