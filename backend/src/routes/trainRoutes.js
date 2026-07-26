const express = require("express");
const { query, param } = require("express-validator");

const {
    getStations,
    searchTrains,
    getJourney,
    getAvailability,
    getSeats,
    getFare
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
            .isIn(["SL", "3A", "2A", "1A"])
            .withMessage("Invalid class type")
    ],
    validate,
    getSeats
);

router.get("/fare", getFare);

module.exports = router;