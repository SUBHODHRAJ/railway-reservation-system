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

module.exports = {
    dashboard,
    getUsers,
    getBookings,
    getTrains
};