const express = require("express");
const {
    param,
    body
} = require("express-validator");

const {
    dashboard,
    getUsers,
    getBookings,
    getTrains,
    getJourneys,
    updateJourneyStatus
} = require("../controllers/adminController");

const {
    authenticate,
    adminOnly
} = require("../middleware/authMiddleware");

const validate =
    require("../middleware/validate");

const router = express.Router();

router.use(authenticate);
router.use(adminOnly);

router.get("/dashboard", dashboard);
router.get("/users", getUsers);
router.get("/bookings", getBookings);
router.get("/trains", getTrains);
router.get("/journeys", getJourneys);

router.patch(
    "/journeys/:id/status",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Invalid journey ID"),

        body("status")
            .isIn([
                "SCHEDULED",
                "CANCELLED",
                "COMPLETED"
            ])
            .withMessage(
                "Invalid journey status"
            )
    ],
    validate,
    updateJourneyStatus
);

module.exports = router;
