const express = require("express");

const {
    dashboard,
    getUsers,
    getBookings,
    getTrains
} = require("../controllers/adminController");

const {
    authenticate,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(adminOnly);

router.get("/dashboard", dashboard);
router.get("/users", getUsers);
router.get("/bookings", getBookings);
router.get("/trains", getTrains);

module.exports = router;