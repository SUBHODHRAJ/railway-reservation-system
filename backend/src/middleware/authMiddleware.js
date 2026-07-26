const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
};
const verifiedOnly = async (req, res, next) => {
    try {
        const db = require("../config/db");

        const [users] = await db.query(
            `SELECT email_verified
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (
            users.length === 0 ||
            !users[0].email_verified
        ) {
            return res.status(403).json({
                message: "Email verification required"
            });
        }

        next();
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    authenticate,
    adminOnly,
    verifiedOnly
};