const express = require("express");
const {
    param,
    body
} = require("express-validator");
const {
    getExternalTrain,
    importExternalTrain,
    createTrainInventory,
    syncExternalTrain,
    generateTrainFares
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

router.post(
    "/trains/:trainNumber/fares/generate",
    authenticate,
    adminOnly,
    trainNumberValidation,
    validate,
    generateTrainFares
);

module.exports = router;