const express = require("express");
const router = express.Router();
const AuthController = require("../Controllers/Auth.Controller");
const OTPController = require("../Controllers/OTP.controller");

router.post("/signup", AuthController.signup);

router.post("/signin", OTPController.verify, AuthController.signin);

router.post("/refresh-token", AuthController.refreshToken);

router.delete("/logout", AuthController.logout);

module.exports = router;
