const express = require("express");

const {
    createPayment,
    completePayment
} = require("../controllers/paymentController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authenticate, createPayment);
router.post("/complete", authenticate, completePayment);

module.exports = router;
