const express = require("express");

const {
    sendVerificationOTP,
    verifyOTP
} = require("../controllers/otpController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send", authenticate, sendVerificationOTP);
router.post("/verify", authenticate, verifyOTP);

module.exports = router;