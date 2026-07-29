const express = require("express");
const {
    query,
    param,
    body
} = require("express-validator");
const {
    getStations,
    searchTrains,
    getJourney,
    getAvailability,
    getSeats,
    getFare,
    provisionTrainJourney
} = require("../controllers/trainController");

const validate = require("../middleware/validate");

const router = express.Router();

router.get("/stations", getStations);

router.get(
    "/search",
    [
        query("source")
            .trim()
            .notEmpty()
            .withMessage("Source is required"),

        query("destination")
            .trim()
            .notEmpty()
            .withMessage("Destination is required"),

        query("date")
            .isISO8601({ strict: true })
            .withMessage("Date must be YYYY-MM-DD")
    ],
    validate,
    searchTrains
);
router.post(
    "/provision",
    [
        body("trainNumber")
            .trim()
            .matches(/^\d{5}$/)
            .withMessage(
                "Train number must be 5 digits"
            ),

        body("journeyDate")
            .isISO8601({
                strict: true
            })
            .withMessage(
                "Journey date must be YYYY-MM-DD"
            )
    ],
    validate,
    provisionTrainJourney
);

router.get(
    "/journeys/:id",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid journey ID")
    ],
    validate,
    getJourney
);

router.get(
    "/journeys/:id/availability",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid journey ID")
    ],
    validate,
    getAvailability
);

router.get(
    "/journeys/:id/seats",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid journey ID"),

        query("classType")
    .isIn(["2S", "SL", "3A", "2A", "1A", "CC", "EC"])
            .withMessage("Invalid class type")
    ],
    validate,
    getSeats
);
router.get(
    "/fare",
    [
        query("trainId")
            .isInt({ min: 1 })
            .withMessage("Invalid train ID")
            .toInt(),

        query("source")
            .trim()
            .notEmpty()
            .withMessage("Source is required")
            .toUpperCase(),

        query("destination")
            .trim()
            .notEmpty()
            .withMessage("Destination is required")
            .toUpperCase(),

        query("classType")
            .trim()
            .toUpperCase()
            .isIn(["2S", "SL", "3A", "2A", "1A", "CC", "EC"])
            .withMessage("Invalid class type")
    ],
    validate,
    getFare
);

module.exports = router;
