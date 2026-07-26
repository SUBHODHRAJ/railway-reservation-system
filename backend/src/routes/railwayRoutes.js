const express = require("express");
const { param } = require("express-validator");

const {
    getExternalTrain
} = require("../controllers/railwayController");

const validate = require("../middleware/validate");

const router = express.Router();

router.get(
    "/trains/:trainNumber",
    [
        param("trainNumber")
            .trim()
            .matches(/^\d{5}$/)
            .withMessage("Train number must be 5 digits")
    ],
    validate,
    getExternalTrain
);

module.exports = router;