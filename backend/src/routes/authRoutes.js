const express = require("express");
const { body } = require("express-validator");

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

const validate = require("../middleware/validate");

const router = express.Router();

const nameValidation = body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
        "Name must be between 2 and 100 characters"
    );

const emailValidation = body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .isLength({ max: 150 })
    .withMessage(
        "Email must be 150 characters or fewer"
    )
    .normalizeEmail();

router.post(
    "/register",
    [
        nameValidation,
        emailValidation,

        body("password")
            .isString()
            .withMessage("Password is required")
            .isLength({ min: 8, max: 128 })
            .withMessage(
                "Password must be between 8 and 128 characters"
            )
    ],
    validate,
    register
);

router.post(
    "/login",
    [
        emailValidation,

        body("password")
            .isString()
            .withMessage("Password is required")
            .notEmpty()
            .withMessage("Password is required")
    ],
    validate,
    login
);

router.get(
    "/profile",
    authenticate,
    profile
);

router.patch(
    "/profile",
    authenticate,
    [
        nameValidation,
        emailValidation
    ],
    validate,
    updateProfile
);

router.patch(
    "/password",
    authenticate,
    [
        body("currentPassword")
            .isString()
            .withMessage(
                "Current password is required"
            )
            .notEmpty()
            .withMessage(
                "Current password is required"
            ),

        body("newPassword")
            .isString()
            .withMessage(
                "New password is required"
            )
            .isLength({ min: 8, max: 128 })
            .withMessage(
                "New password must be between 8 and 128 characters"
            )
            .custom(
                (newPassword, { req }) => {
                    if (
                        newPassword ===
                        req.body.currentPassword
                    ) {
                        throw new Error(
                            "New password must be different from the current password"
                        );
                    }

                    return true;
                }
            )
    ],
    validate,
    changePassword
);

module.exports = router;