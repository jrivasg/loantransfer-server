const express = require("express");
const router = express.Router();
const OTPcontroller = require("../Controllers/OTP.controller");


router.post("/email", OTPcontroller.sendOTPcode);
router.post("/verify", OTPcontroller.verify);

module.exports = router;
