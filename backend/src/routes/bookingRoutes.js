const express = require("express");

const {
    body,
    param
} = require("express-validator");

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

const validate =
    require("../middleware/validate");

const router = express.Router();
router.use(
    authenticate,
    verifiedOnly
);

router.post(
    "/hold",
    [
        body("journeyId")
            .isInt({ min: 1 })
            .withMessage(
                "Invalid journey ID"
            )
            .toInt(),

        body("seatIds")
            .isArray({ min: 1, max: 12 })
            .withMessage(
                "Select between 1 and 12 seats"
            ),

        body("seatIds.*")
            .isInt({ min: 1 })
            .withMessage(
                "Invalid seat ID"
            )
            .toInt(),

        body("seatIds")
            .custom(seatIds => {
                if (!Array.isArray(seatIds)) {
                    return true;
                }

                const unique =
                    new Set(seatIds.map(Number));

                if (
                    unique.size !==
                    seatIds.length
                ) {
                    throw new Error(
                        "Duplicate seats are not allowed"
                    );
                }

                return true;
            })
    ],
    validate,
    holdSeats
);

router.post(
    "/",
    [
        body("journeyId")
            .isInt({ min: 1 })
            .withMessage(
                "Invalid journey ID"
            )
            .toInt(),

        body("source")
            .trim()
            .notEmpty()
            .withMessage(
                "Source is required"
            )
            .isLength({ min: 2, max: 20 })
            .withMessage(
                "Invalid source station"
            ),

        body("destination")
            .trim()
            .notEmpty()
            .withMessage(
                "Destination is required"
            )
            .isLength({ min: 2, max: 20 })
            .withMessage(
                "Invalid destination station"
            ),
        body("classType")
            .trim()
            .notEmpty()
            .withMessage(
                "Class type is required"
            )
            .isIn([
                "1A",
                "2A",
                "3A",
                "SL",
                "CC",
                "EC"
            ])
            .withMessage(
                "Invalid class type"
            ),
        body("passengers")
            .isArray({ min: 1, max: 12 })
            .withMessage(
                "Between 1 and 12 passengers are required"
            ),

        body("passengers.*.name")
            .trim()
            .notEmpty()
            .withMessage(
                "Passenger name is required"
            )
            .isLength({ min: 2, max: 100 })
            .withMessage(
                "Passenger name must be between 2 and 100 characters"
            ),

        body("passengers.*.age")
            .isInt({ min: 1, max: 125 })
            .withMessage(
                "Passenger age must be between 1 and 125"
            )
            .toInt(),

        body("passengers.*.gender")
            .trim()
            .toUpperCase()
            .isIn([
                "MALE",
                "FEMALE",
                "OTHER"
            ])
            .withMessage(
                "Invalid passenger gender"
            ),

        body("passengers.*.seatId")
            .isInt({ min: 1 })
            .withMessage(
                "Invalid passenger seat"
            )
            .toInt(),

        body("passengers")
            .custom(passengers => {
                if (!Array.isArray(passengers)) {
                    return true;
                }

                const seatIds =
                    passengers.map(
                        passenger =>
                            Number(
                                passenger.seatId
                            )
                    );

                if (
                    new Set(seatIds).size !==
                    seatIds.length
                ) {
                    throw new Error(
                        "Duplicate seats are not allowed"
                    );
                }

                return true;
            })
    ],
    validate,
    createBooking
);

router.get(
    "/my",
    getMyBookings
);

router.get(
    "/pnr/:pnr",
    [
        param("pnr")
            .trim()
            .notEmpty()
            .withMessage("PNR is required")
            .isLength({ min: 5, max: 30 })
            .withMessage("Invalid PNR")
    ],
    validate,
    getBookingByPNR
);

router.patch(
    "/:id/cancel",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage(
                "Invalid booking ID"
            )
            .toInt()
    ],
    validate,
    cancelBooking
);

module.exports = router;