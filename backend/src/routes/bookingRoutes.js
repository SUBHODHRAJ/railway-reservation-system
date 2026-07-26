const express = require("express");

const {
    holdSeats,
    createBooking,
    getMyBookings,
    getBookingByPNR,
    cancelBooking
} = require("../controllers/bookingController");

const {
    authenticate,
    verifiedOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/hold",
    authenticate,
    verifiedOnly,
    holdSeats
);
router.get("/my", authenticate, getMyBookings);

router.get("/pnr/:pnr", authenticate, getBookingByPNR);

router.patch("/:id/cancel", authenticate, cancelBooking);

router.post(
    "/",
    authenticate,
    verifiedOnly,
    createBooking
);

module.exports = router;