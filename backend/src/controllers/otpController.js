const crypto = require("crypto");
const db = require("../config/db");
const { sendOTP } = require("../services/emailService");

const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

const hashOTP = otp => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const sendVerificationOTP = async (req, res) => {
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [users] = await connection.query(
            `SELECT id, email, email_verified
             FROM users
             WHERE id = ?
             FOR UPDATE`,
            [req.user.id]
        );

        if (users.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        if (user.email_verified) {
            await connection.rollback();

            return res.status(400).json({
                message: "Email is already verified"
            });
        }

        const [latest] = await connection.query(
            `SELECT
                id,
                created_at,
                TIMESTAMPDIFF(
                    SECOND,
                    created_at,
                    NOW()
                ) AS seconds_since_created
             FROM otp_verifications
             WHERE user_id = ?
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE`,
            [user.id]
        );

        if (latest.length > 0) {
            const elapsed = Number(latest[0].seconds_since_created);

            if (elapsed < OTP_COOLDOWN_SECONDS) {
                const retryAfter = OTP_COOLDOWN_SECONDS - elapsed;

                await connection.rollback();

                return res.status(429).json({
                    message: "Please wait before requesting another verification code",
                    retryAfter
                });
            }
        }

        /*
         * Invalidate all previous unused OTPs.
         */
        await connection.query(
            `UPDATE otp_verifications
             SET used_at = NOW()
             WHERE user_id = ?
               AND used_at IS NULL`,
            [user.id]
        );

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        const [result] = await connection.query(
            `INSERT INTO otp_verifications
                (
                    user_id,
                    otp_hash,
                    attempts,
                    expires_at
                )
             VALUES (
                ?,
                ?,
                0,
                DATE_ADD(NOW(), INTERVAL ? MINUTE)
             )`,
            [
                user.id,
                otpHash,
                OTP_EXPIRY_MINUTES
            ]
        );

        /*
         * Commit before SMTP so the database transaction
         * is not held open while waiting for the mail server.
         */
        await connection.commit();

        try {
            await sendOTP(user.email, otp);
        } catch (emailError) {
            /*
             * The OTP must not remain usable when email
             * delivery fails.
             */
            await db.query(
                `UPDATE otp_verifications
                 SET used_at = NOW()
                 WHERE id = ?
                   AND used_at IS NULL`,
                [result.insertId]
            );

            console.error("OTP email delivery failed:", emailError.message);

            return res.status(500).json({
                message: "Unable to send verification code"
            });
        }

        return res.json({
            message: "Verification code sent",
            expiresInMinutes: OTP_EXPIRY_MINUTES,
            resendCooldownSeconds: OTP_COOLDOWN_SECONDS
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }

        console.error("Send OTP error:", error);

        return res.status(500).json({
            message: "Unable to send verification code"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const verifyOTP = async (req, res) => {
    let connection;

    try {
        const { otp } = req.body;

        if (!otp || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Valid 6-digit OTP is required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [users] = await connection.query(
            `SELECT id, email_verified
             FROM users
             WHERE id = ?
             FOR UPDATE`,
            [req.user.id]
        );

        if (users.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "User not found"
            });
        }

        if (users[0].email_verified) {
            await connection.rollback();

            return res.json({
                message: "Email already verified"
            });
        }

        const [records] = await connection.query(
            `SELECT
                id,
                otp_hash,
                attempts,
                expires_at
             FROM otp_verifications
             WHERE user_id = ?
               AND used_at IS NULL
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE`,
            [req.user.id]
        );

        if (records.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "No active verification code"
            });
        }

        const record = records[0];

        /*
         * DATE strings are handled by MySQL itself rather than
         * relying on JavaScript timezone conversion.
         */
        const [expiryCheck] = await connection.query(
            `SELECT NOW() > ? AS expired`,
            [record.expires_at]
        );

        if (expiryCheck[0].expired) {
            await connection.query(
                `UPDATE otp_verifications
                 SET used_at = NOW()
                 WHERE id = ?`,
                [record.id]
            );

            await connection.commit();

            return res.status(400).json({
                message: "Verification code expired"
            });
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await connection.query(
                `UPDATE otp_verifications
                 SET used_at = NOW()
                 WHERE id = ?`,
                [record.id]
            );

            await connection.commit();

            return res.status(429).json({
                message: "Too many incorrect attempts. Request a new verification code."
            });
        }

        const suppliedHash = hashOTP(otp);

        const storedBuffer = Buffer.from(record.otp_hash, "hex");
        const suppliedBuffer = Buffer.from(suppliedHash, "hex");

        const matches =
            storedBuffer.length === suppliedBuffer.length &&
            crypto.timingSafeEqual(
                storedBuffer,
                suppliedBuffer
            );

        if (!matches) {
            const newAttempts = Number(record.attempts) + 1;

            if (newAttempts >= MAX_OTP_ATTEMPTS) {
                await connection.query(
                    `UPDATE otp_verifications
                     SET attempts = ?,
                         used_at = NOW()
                     WHERE id = ?`,
                    [
                        newAttempts,
                        record.id
                    ]
                );

                await connection.commit();

                return res.status(429).json({
                    message: "Too many incorrect attempts. Request a new verification code."
                });
            }

            await connection.query(
                `UPDATE otp_verifications
                 SET attempts = ?
                 WHERE id = ?`,
                [
                    newAttempts,
                    record.id
                ]
            );

            await connection.commit();

            return res.status(400).json({
                message: "Invalid verification code",
                attemptsRemaining:
                    MAX_OTP_ATTEMPTS - newAttempts
            });
        }

        await connection.query(
            `UPDATE users
             SET email_verified = TRUE
             WHERE id = ?`,
            [req.user.id]
        );

        await connection.query(
            `UPDATE otp_verifications
             SET used_at = NOW()
             WHERE id = ?`,
            [record.id]
        );

        await connection.commit();

        return res.json({
            message: "Email verified successfully"
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }

        console.error("Verify OTP error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    sendVerificationOTP,
    verifyOTP
};