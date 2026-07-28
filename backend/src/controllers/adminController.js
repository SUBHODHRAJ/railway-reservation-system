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

const updateJourneyStatus = async (
    req,
    res
) => {
    try {
        const journeyId =
            Number(req.params.id);

        const status = req.body.status;

        const [journeys] = await db.query(
            `SELECT id, status
             FROM journeys
             WHERE id = ?
             LIMIT 1`,
            [journeyId]
        );

        if (journeys.length === 0) {
            return res.status(404).json({
                message: "Journey not found"
            });
        }

        const currentStatus =
            journeys[0].status;

        if (currentStatus === status) {
            return res.json({
                message:
                    "Journey status unchanged",
                journeyId,
                status
            });
        }

        if (
            currentStatus === "COMPLETED"
        ) {
            return res.status(409).json({
                message:
                    "Completed journeys cannot be modified"
            });
        }

        await db.query(
            `UPDATE journeys
             SET status = ?
             WHERE id = ?`,
            [status, journeyId]
        );

        res.json({
            message:
                "Journey status updated successfully",
            journeyId,
            status
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
module.exports = {
    dashboard,
    getUsers,
    getBookings,
    getTrains,
    getJourneys,
    updateJourneyStatus
};