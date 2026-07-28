const express = require("express");
const { body } = require("express-validator");

const {
    createPayment,
    completePayment
} = require("../controllers/paymentController");

const {
    authenticate,
    verifiedOnly
} = require("../middleware/authMiddleware");
const validate =
    require("../middleware/validate");

const router = express.Router();

router.use(
    authenticate,
    verifiedOnly
);
router.post(
    "/create",
    [
        body("bookingId")
            .isInt({ min: 1 })
            .withMessage(
                "Invalid booking ID"
            )
            .toInt()
    ],
    validate,
    createPayment
);

router.post(
    "/complete",
    [
        body("paymentId")
            .isInt({ min: 1 })
            .withMessage(
                "Invalid payment ID"
            )
            .toInt(),

        body("success")
            .isBoolean({ strict: true })
            .withMessage(
                "success must be a boolean"
            )
            .toBoolean()
    ],
    validate,
    completePayment
);

module.exports = router;
