const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const cleanName = String(name || "").trim();
        const cleanEmail = String(email || "")
            .trim()
            .toLowerCase();

        if (!cleanName || !cleanEmail || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                message: "Name must be 100 characters or fewer"
            });
        }

        if (cleanEmail.length > 150) {
            return res.status(400).json({
                message: "Email must be 150 characters or fewer"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const passwordHash = await bcrypt.hash(
            password,
            10
        );

        const [result] = await db.query(
            `INSERT INTO users
                (name, email, password_hash, role, email_verified)
             VALUES (?, ?, ?, 'USER', FALSE)`,
            [
                cleanName,
                cleanEmail,
                passwordHash
            ]
        );

        res.status(201).json({
            message: "User registered successfully",
            userId: result.insertId
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const cleanEmail = String(email || "")
            .trim()
            .toLowerCase();

        if (!cleanEmail || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [users] = await db.query(
            `SELECT
                id,
                name,
                email,
                password_hash,
                role,
                email_verified
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const validPassword =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: Boolean(
                    user.email_verified
                )
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const profile = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT
                id,
                name,
                email,
                role,
                email_verified,
                created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const cleanName = String(
            req.body.name || ""
        ).trim();

        const cleanEmail = String(
            req.body.email || ""
        )
            .trim()
            .toLowerCase();

        if (!cleanName || !cleanEmail) {
            return res.status(400).json({
                message: "Name and email are required"
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                message: "Name must be 100 characters or fewer"
            });
        }

        if (cleanEmail.length > 150) {
            return res.status(400).json({
                message: "Email must be 150 characters or fewer"
            });
        }

        const [users] = await db.query(
            `SELECT
                id,
                name,
                email,
                role,
                email_verified
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const currentUser = users[0];

        const [existing] = await db.query(
            `SELECT id
             FROM users
             WHERE email = ?
               AND id <> ?`,
            [
                cleanEmail,
                req.user.id
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const emailChanged =
            cleanEmail !==
            String(currentUser.email).toLowerCase();

        await db.query(
            `UPDATE users
             SET
                name = ?,
                email = ?,
                email_verified = ?
             WHERE id = ?`,
            [
                cleanName,
                cleanEmail,
                emailChanged
                    ? false
                    : currentUser.email_verified,
                req.user.id
            ]
        );

        const [updatedUsers] = await db.query(
            `SELECT
                id,
                name,
                email,
                role,
                email_verified,
                created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        res.json({
            message: emailChanged
                ? "Profile updated. Please verify your new email address."
                : "Profile updated successfully",
            emailChanged,
            user: updatedUsers[0]
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message:
                    "Current password and new password are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message:
                    "New password must be at least 8 characters"
            });
        }

        if (newPassword.length > 128) {
            return res.status(400).json({
                message:
                    "New password must be 128 characters or fewer"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message:
                    "New password must be different from the current password"
            });
        }

        const [users] = await db.query(
            `SELECT id, password_hash
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const validPassword =
            await bcrypt.compare(
                currentPassword,
                users[0].password_hash
            );

        if (!validPassword) {
            return res.status(401).json({
                message:
                    "Current password is incorrect"
            });
        }

        const passwordHash =
            await bcrypt.hash(
                newPassword,
                10
            );

        await db.query(
            `UPDATE users
             SET password_hash = ?
             WHERE id = ?`,
            [
                passwordHash,
                req.user.id
            ]
        );

        res.json({
            message:
                "Password changed successfully"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    register,
    login,
    profile,
    updateProfile,
    changePassword
};