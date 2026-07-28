const express = require("express");
const { body } = require("express-validator");

const {
    sendVerificationOTP,
    verifyOTP
} = require("../controllers/otpController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const validate =
    require("../middleware/validate");

const router = express.Router();

router.use(authenticate);

router.post(
    "/send",
    sendVerificationOTP
);

router.post(
    "/verify",
    [
        body("otp")
            .isString()
            .withMessage(
                "Verification code is required"
            )
            .matches(/^\d{6}$/)
            .withMessage(
                "Valid 6-digit OTP is required"
            )
    ],
    validate,
    verifyOTP
);

module.exports = router;