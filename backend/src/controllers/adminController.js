const db = require("../config/db");

const dashboard = async (req, res) => {
    try {
        const [[users]] = await db.query(
            "SELECT COUNT(*) AS count FROM users"
        );

        const [[trains]] = await db.query(
            "SELECT COUNT(*) AS count FROM trains"
        );

        const [[journeys]] = await db.query(
            "SELECT COUNT(*) AS count FROM journeys"
        );

        const [[bookings]] = await db.query(
            "SELECT COUNT(*) AS count FROM bookings"
        );

        const [[confirmed]] = await db.query(
            `SELECT COUNT(*) AS count
             FROM bookings
             WHERE status = 'CONFIRMED'`
        );

        const [[revenue]] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) AS total
             FROM payments
             WHERE status = 'SUCCESS'`
        );

        res.json({
            users: Number(users.count),
            trains: Number(trains.count),
            journeys: Number(journeys.count),
            bookings: Number(bookings.count),
            confirmedBookings: Number(confirmed.count),
            revenue: Number(revenue.total)
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getUsers = async (req, res) => {
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
             ORDER BY id DESC`
        );

        res.json(users);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT
                b.id,
                b.pnr,
                b.total_fare,
                b.status,
                b.booked_at,

                u.id AS user_id,
                u.name AS user_name,
                u.email,

                j.journey_date,

                t.train_number,
                t.train_name,

                src.station_code AS source,
                dst.station_code AS destination

             FROM bookings b

             JOIN users u
                ON u.id = b.user_id

             JOIN journeys j
                ON j.id = b.journey_id

             JOIN trains t
                ON t.id = j.train_id

             JOIN stations src
                ON src.id = b.source_station_id

             JOIN stations dst
                ON dst.id = b.destination_station_id

             ORDER BY b.booked_at DESC`
        );

        res.json(bookings);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getTrains = async (req, res) => {
    try {
        const [trains] = await db.query(
            `SELECT
                t.id,
                t.train_number,
                t.train_name,
                COUNT(DISTINCT c.id) AS coaches,
                COUNT(DISTINCT j.id) AS journeys
             FROM trains t
             LEFT JOIN coaches c ON c.train_id = t.id
             LEFT JOIN journeys j ON j.train_id = t.id
             GROUP BY t.id, t.train_number, t.train_name
             ORDER BY t.train_number`
        );

        res.json(trains);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getJourneys = async (req, res) => {
    try {
        const [journeys] = await db.query(
            `SELECT
                j.id,
                j.journey_date,
                j.status,
                j.created_at,
                t.id AS train_id,
                t.train_number,
                t.train_name,
                COUNT(DISTINCT sa.seat_id) AS total_seats,
                SUM(
                    CASE
                        WHEN sa.status = 'AVAILABLE'
                        THEN 1
                        ELSE 0
                    END
                ) AS available_seats,
                COUNT(DISTINCT b.id) AS bookings
             FROM journeys j
             JOIN trains t
                ON t.id = j.train_id
             LEFT JOIN seat_availability sa
                ON sa.journey_id = j.id
             LEFT JOIN bookings b
                ON b.journey_id = j.id
             GROUP BY
                j.id,
                j.journey_date,
                j.status,
                j.created_at,
                t.id,
                t.train_number,
                t.train_name
             ORDER BY
                j.journey_date DESC,
                t.train_number`
        );

        res.json(
            journeys.map(journey => ({
                ...journey,
                total_seats:
                    Number(
                        journey.total_seats || 0
                    ),
                available_seats:
                    Number(
                        journey.available_seats || 0
                    ),
                bookings:
                    Number(
                        journey.bookings || 0
                    )
            }))
        );
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const updateJourneyStatus = async (req, res) => {
    let connection;

    try {
        const journeyId = Number(req.params.id);
        const status = req.body.status;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [journeys] = await connection.query(
            `SELECT id, status
             FROM journeys
             WHERE id = ?
             FOR UPDATE`,
            [journeyId]
        );

        if (journeys.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Journey not found"
            });
        }

        const currentStatus = journeys[0].status;

        if (currentStatus === status) {
            await connection.rollback();

            return res.json({
                message: "Journey status unchanged",
                journeyId,
                status
            });
        }

        if (
            currentStatus === "CANCELLED" ||
            currentStatus === "COMPLETED"
        ) {
            await connection.rollback();

            return res.status(409).json({
                message:
                    `${currentStatus} journeys cannot be modified`
            });
        }

        if (status === "SCHEDULED") {
            await connection.rollback();

            return res.status(409).json({
                message:
                    "Journey is already in its active lifecycle"
            });
        }

        if (status === "COMPLETED") {
            const [activeBookings] =
                await connection.query(
                    `SELECT COUNT(*) AS count
                     FROM bookings
                     WHERE journey_id = ?
                       AND status = 'PENDING'`,
                    [journeyId]
                );

            if (
                Number(activeBookings[0].count) > 0
            ) {
                await connection.rollback();

                return res.status(409).json({
                    message:
                        "Journey cannot be completed while pending bookings exist"
                });
            }

            await connection.query(
                `UPDATE journeys
                 SET status = 'COMPLETED'
                 WHERE id = ?`,
                [journeyId]
            );

            await connection.commit();

            return res.json({
                message:
                    "Journey marked as completed",
                journeyId,
                status: "COMPLETED"
            });
        }

        if (status === "CANCELLED") {
            /*
             * Lock affected bookings before changing
             * booking/payment/inventory state.
             */
            const [affectedBookings] =
                await connection.query(
                    `SELECT id, status
                     FROM bookings
                     WHERE journey_id = ?
                       AND status IN (
                           'PENDING',
                           'CONFIRMED',
                           'PAYMENT_FAILED'
                       )
                     FOR UPDATE`,
                    [journeyId]
                );

            const bookingIds =
                affectedBookings.map(
                    booking => booking.id
                );

            let refundedPayments = 0;
            let failedPayments = 0;

            if (bookingIds.length > 0) {
                const placeholders =
                    bookingIds
                        .map(() => "?")
                        .join(",");

                const [successfulPayments] =
                    await connection.query(
                        `SELECT id
                         FROM payments
                         WHERE booking_id IN (${placeholders})
                           AND status = 'SUCCESS'
                         FOR UPDATE`,
                        bookingIds
                    );

                const [createdPayments] =
                    await connection.query(
                        `SELECT id
                         FROM payments
                         WHERE booking_id IN (${placeholders})
                           AND status = 'CREATED'
                         FOR UPDATE`,
                        bookingIds
                    );

                refundedPayments =
                    successfulPayments.length;

                failedPayments =
                    createdPayments.length;

                if (refundedPayments > 0) {
                    const paymentIds =
                        successfulPayments.map(
                            payment => payment.id
                        );

                    const paymentPlaceholders =
                        paymentIds
                            .map(() => "?")
                            .join(",");

                    await connection.query(
                        `UPDATE payments
                         SET status = 'REFUNDED'
                         WHERE id IN (${paymentPlaceholders})`,
                        paymentIds
                    );
                }

                if (failedPayments > 0) {
                    const paymentIds =
                        createdPayments.map(
                            payment => payment.id
                        );

                    const paymentPlaceholders =
                        paymentIds
                            .map(() => "?")
                            .join(",");

                    await connection.query(
                        `UPDATE payments
                         SET status = 'FAILED'
                         WHERE id IN (${paymentPlaceholders})`,
                        paymentIds
                    );
                }

                await connection.query(
                    `UPDATE bookings
                     SET status = 'CANCELLED'
                     WHERE journey_id = ?
                       AND status IN (
                           'PENDING',
                           'CONFIRMED',
                           'PAYMENT_FAILED'
                       )`,
                    [journeyId]
                );
            }

            /*
             * A cancelled journey cannot have usable
             * reservation inventory.
             */
            await connection.query(
                `UPDATE seat_availability
                 SET status = 'AVAILABLE',
                     held_by = NULL,
                     hold_expires_at = NULL
                 WHERE journey_id = ?
                   AND status IN ('HELD', 'BOOKED')`,
                [journeyId]
            );

            await connection.query(
                `UPDATE journeys
                 SET status = 'CANCELLED'
                 WHERE id = ?`,
                [journeyId]
            );

            await connection.commit();

            return res.json({
                message:
                    "Journey cancelled successfully",
                journeyId,
                status: "CANCELLED",
                cancelledBookings:
                    bookingIds.length,
                refundedPayments,
                failedPayments
            });
        }

        await connection.rollback();

        return res.status(400).json({
            message: "Invalid journey status transition"
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
const updateUserRole = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { role } = req.body;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (!["USER", "ADMIN"].includes(role)) {
            return res.status(400).json({
                message: "Role must be USER or ADMIN"
            });
        }

        if (userId === Number(req.user.id)) {
            return res.status(400).json({
                message: "You cannot change your own admin role"
            });
        }

        const [users] = await db.query(
            `SELECT id, name, email, role
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (users[0].role === role) {
            return res.json({
                message: "User already has this role",
                user: users[0]
            });
        }

        await db.query(
            `UPDATE users
             SET role = ?
             WHERE id = ?`,
            [role, userId]
        );

        return res.json({
            message: "User role updated successfully",
            user: {
                ...users[0],
                role
            }
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Unable to update user role"
        });
    }
};
module.exports = {
    dashboard,
    getUsers,
    getBookings,
    getTrains,
    getJourneys,
    updateJourneyStatus,
    updateUserRole
};