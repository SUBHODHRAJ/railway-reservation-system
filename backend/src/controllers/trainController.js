const db = require("../config/db");

const getStations = async (req, res) => {
    try {
        const { q = "" } = req.query;

        const [stations] = await db.query(
            `SELECT id, station_code, station_name, city
             FROM stations
             WHERE station_code LIKE ?
                OR station_name LIKE ?
                OR city LIKE ?
             ORDER BY station_name`,
            [`%${q}%`, `%${q}%`, `%${q}%`]
        );

        res.json(stations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const searchTrains = async (req, res) => {
    try {
        const { source, destination, date } = req.query;

        if (!source || !destination || !date) {
            return res.status(400).json({
                message: "source, destination and date are required"
            });
        }

        if (source === destination) {
            return res.status(400).json({
                message: "Source and destination cannot be same"
            });
        }

        const [trains] = await db.query(
            `SELECT
                j.id AS journey_id,
                j.journey_date,
                j.status,
                t.id AS train_id,
                t.train_number,
                t.train_name,

                src.station_code AS source_code,
                src.station_name AS source_name,
                sr.departure_time,

                dst.station_code AS destination_code,
                dst.station_name AS destination_name,
                dr.arrival_time

             FROM journeys j

             JOIN trains t
                ON t.id = j.train_id

             JOIN train_routes sr
                ON sr.train_id = t.id

             JOIN stations src
                ON src.id = sr.station_id

             JOIN train_routes dr
                ON dr.train_id = t.id

             JOIN stations dst
                ON dst.id = dr.station_id

             WHERE src.station_code = ?
               AND dst.station_code = ?
               AND sr.stop_number < dr.stop_number
               AND j.journey_date = ?
               AND j.status = 'SCHEDULED'

             ORDER BY sr.departure_time`,
            [
                source.toUpperCase(),
                destination.toUpperCase(),
                date
            ]
        );

        res.json(trains);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getJourney = async (req, res) => {
    try {
        const { id } = req.params;

        const [journeys] = await db.query(
            `SELECT
                j.id,
                j.journey_date,
                j.status,
                t.id AS train_id,
                t.train_number,
                t.train_name
             FROM journeys j
             JOIN trains t ON t.id = j.train_id
             WHERE j.id = ?`,
            [id]
        );

        if (journeys.length === 0) {
            return res.status(404).json({
                message: "Journey not found"
            });
        }

        const [route] = await db.query(
            `SELECT
                s.id AS station_id,
                s.station_code,
                s.station_name,
                s.city,
                tr.stop_number,
                tr.arrival_time,
                tr.departure_time
             FROM train_routes tr
             JOIN stations s ON s.id = tr.station_id
             WHERE tr.train_id = ?
             ORDER BY tr.stop_number`,
            [journeys[0].train_id]
        );

        res.json({
            ...journeys[0],
            route
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        // Expired holds become available again.
        await db.query(
            `UPDATE seat_availability
             SET status = 'AVAILABLE',
                 held_by = NULL,
                 hold_expires_at = NULL
             WHERE journey_id = ?
               AND status = 'HELD'
               AND hold_expires_at < NOW()`,
            [id]
        );

        const [rows] = await db.query(
            `SELECT
                c.class_type,
                COUNT(sa.id) AS total_seats,

                SUM(
                    CASE
                        WHEN sa.status = 'AVAILABLE' THEN 1
                        ELSE 0
                    END
                ) AS available_seats

             FROM coaches c

             JOIN seats s
                ON s.coach_id = c.id

             JOIN journeys j
                ON j.train_id = c.train_id

             LEFT JOIN seat_availability sa
                ON sa.seat_id = s.id
               AND sa.journey_id = j.id

             WHERE j.id = ?

             GROUP BY c.class_type
             ORDER BY FIELD(c.class_type, 'SL', '3A', '2A', '1A')`,
            [id]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getSeats = async (req, res) => {
    try {
        const { id } = req.params;
        const { classType } = req.query;

        if (!classType) {
            return res.status(400).json({
                message: "classType is required"
            });
        }

        await db.query(
            `UPDATE seat_availability
             SET status = 'AVAILABLE',
                 held_by = NULL,
                 hold_expires_at = NULL
             WHERE journey_id = ?
               AND status = 'HELD'
               AND hold_expires_at < NOW()`,
            [id]
        );

        const [seats] = await db.query(
            `SELECT
                s.id AS seat_id,
                c.coach_number,
                c.class_type,
                s.seat_number,
                s.berth_type,
                COALESCE(sa.status, 'AVAILABLE') AS status

             FROM journeys j

             JOIN coaches c
                ON c.train_id = j.train_id

             JOIN seats s
                ON s.coach_id = c.id

             LEFT JOIN seat_availability sa
                ON sa.journey_id = j.id
               AND sa.seat_id = s.id

             WHERE j.id = ?
               AND c.class_type = ?

             ORDER BY c.coach_number, s.seat_number`,
            [id, classType.toUpperCase()]
        );

        res.json(seats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getFare = async (req, res) => {
    try {
        const {
            trainId,
            source,
            destination,
            classType
        } = req.query;

        if (!trainId || !source || !destination || !classType) {
            return res.status(400).json({
                message:
                    "trainId, source, destination and classType are required"
            });
        }

        const [fares] = await db.query(
            `SELECT
                f.id,
                f.amount,
                f.class_type,
                src.station_code AS source,
                dst.station_code AS destination

             FROM fares f

             JOIN stations src
                ON src.id = f.source_station_id

             JOIN stations dst
                ON dst.id = f.destination_station_id

             WHERE f.train_id = ?
               AND src.station_code = ?
               AND dst.station_code = ?
               AND f.class_type = ?`,
            [
                trainId,
                source.toUpperCase(),
                destination.toUpperCase(),
                classType.toUpperCase()
            ]
        );

        if (fares.length === 0) {
            return res.status(404).json({
                message: "Fare not configured"
            });
        }

        res.json(fares[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getStations,
    searchTrains,
    getJourney,
    getAvailability,
    getSeats,
    getFare
};