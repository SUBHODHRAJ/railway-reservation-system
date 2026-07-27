const express = require("express");
const { param } = require("express-validator");

const {
    getExternalTrain,
    importExternalTrain
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

module.exports = router;
