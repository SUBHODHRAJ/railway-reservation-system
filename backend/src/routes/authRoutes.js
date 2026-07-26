const express = require("express");

const {
    register,
    login,
    profile
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticate, profile);

module.exports = router;