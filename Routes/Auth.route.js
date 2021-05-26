const express = require("express");
const router = express.Router();
const AuthController = require("../Controllers/Auth.Controller");

router.post("/signup", AuthController.signup);

router.post("/signin", AuthController.signin);

router.post("/refresh-token", AuthController.refreshToken);

router.delete("/logout", AuthController.logout);

module.exports = router;
