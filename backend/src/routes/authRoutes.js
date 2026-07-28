const express = require("express");

const {
    register,
    login,
    profile,
    updateProfile,
    changePassword
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get(
    "/profile",
    authenticate,
    profile
);

router.patch(
    "/profile",
    authenticate,
    updateProfile
);

router.patch(
    "/password",
    authenticate,
    changePassword
);

module.exports = router;