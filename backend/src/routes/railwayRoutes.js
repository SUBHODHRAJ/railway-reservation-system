const express = require("express");
const {
    param,
    body,
    query
} = require("express-validator");
const {
    getExternalTrain,
    importExternalTrain,
    createTrainInventory,
    syncExternalTrain,
    generateTrainFares,
    searchExternalTrains,
    getExternalLiveStatus
} = require("../controllers/railwayController");

const {
    authenticate,
    adminOnly
} = require("../middleware/authMiddleware");

const validate = require("../middleware/validate");

const router = express.Router();

const trainNumberValidation = [
    param("trainNumber")
        .trim()
        .matches(/^\d{5}$/)
        .withMessage("Train number must be 5 digits")
];

const journeyDateValidation = [
    body("journeyDate")
        .isISO8601({ strict: true })
        .withMessage("journeyDate must be a valid date")
];
router.get(
    "/trains/search",
    [
        query("source")
            .trim()
            .matches(/^[A-Za-z0-9]{2,10}$/)
            .withMessage("Invalid source station")
            .toUpperCase(),

        query("destination")
            .trim()
            .matches(/^[A-Za-z0-9]{2,10}$/)
            .withMessage("Invalid destination station")
            .toUpperCase(),

        query("date")
            .isISO8601({ strict: true })
            .withMessage("Date must be YYYY-MM-DD")
    ],
    validate,
    searchExternalTrains
);
router.get(
    "/trains/:trainNumber",
    trainNumberValidation,
    validate,
    getExternalTrain
);

router.post(
    "/trains/:trainNumber/import",
    authenticate,
    adminOnly,
    trainNumberValidation,
    validate,
    importExternalTrain
);

router.post(
    "/trains/:trainNumber/inventory",
    authenticate,
    adminOnly,
    trainNumberValidation,
    journeyDateValidation,
    validate,
    createTrainInventory
);

router.patch(
    "/trains/:trainNumber/sync",
    authenticate,
    adminOnly,
    trainNumberValidation,
    validate,
    syncExternalTrain
);
router.get(
    "/search",
    [
        query("source")
            .trim()
            .matches(/^[A-Za-z0-9]{2,10}$/)
            .withMessage("Invalid source station code")
            .toUpperCase(),

        query("destination")
            .trim()
            .matches(/^[A-Za-z0-9]{2,10}$/)
            .withMessage("Invalid destination station code")
            .toUpperCase(),

        query("date")
            .isISO8601({ strict: true })
            .withMessage("Date must be YYYY-MM-DD")
    ],
    validate,
    searchExternalTrains
);

router.get(
    "/trains/:trainNumber/live",
    [
        ...trainNumberValidation,

        query("date")
            .optional()
            .isISO8601({ strict: true })
            .withMessage("Date must be YYYY-MM-DD")
    ],
    validate,
    getExternalLiveStatus
);
router.post(
    "/trains/:trainNumber/fares/generate",
    authenticate,
    adminOnly,
    trainNumberValidation,
    validate,
    generateTrainFares
);

module.exports = router;