const db = require("../config/db");

const HOLD_MINUTES = 10;

const generatePNR = () => {
    return `TR${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
};

const releaseExpiredHolds = async (connection, journeyId) => {
    const [expiredBookings] = await connection.query(
        `SELECT DISTINCT b.id
         FROM bookings b
         JOIN booking_seats bs
             ON bs.booking_id = b.id
         JOIN seat_availability sa
             ON sa.journey_id = bs.journey_id
            AND sa.seat_id = bs.seat_id
         WHERE b.journey_id = ?
           AND b.status = 'PENDING'
           AND sa.status = 'HELD'
           AND sa.hold_expires_at < NOW()
         FOR UPDATE`,
        [journeyId]
    );

    for (const booking of expiredBookings) {
        await connection.query(
            `UPDATE payments
             SET status = 'FAILED'
             WHERE booking_id = ?
               AND status = 'CREATED'`,
            [booking.id]
        );

        await connection.query(
            `UPDATE bookings
             SET status = 'EXPIRED'
             WHERE id = ?
               AND status = 'PENDING'`,
            [booking.id]
        );
    }

    await connection.query(
        `UPDATE seat_availability
         SET status = 'AVAILABLE',
             held_by = NULL,
             hold_expires_at = NULL
         WHERE journey_id = ?
           AND status = 'HELD'
           AND hold_expires_at < NOW()`,
        [journeyId]
    );
};

const holdSeats = async (req, res) => {
    let connection;

    try {
        const { journeyId, seatIds } = req.body;

        if (!journeyId || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({
                message: "journeyId and seatIds are required"
            });
        }

        const uniqueSeatIds = [...new Set(seatIds.map(Number))];

        if (uniqueSeatIds.some(id => !Number.isInteger(id) || id <= 0)) {
            return res.status(400).json({
                message: "Invalid seat ID"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        await releaseExpiredHolds(connection, journeyId);

        const placeholders = uniqueSeatIds.map(() => "?").join(",");

        const [seats] = await connection.query(
            `SELECT
                sa.id,
                sa.seat_id,
                sa.status,
                sa.held_by
             FROM seat_availability sa
             JOIN seats s ON s.id = sa.seat_id
             JOIN coaches c ON c.id = s.coach_id
             JOIN journeys j ON j.id = sa.journey_id
             WHERE sa.journey_id = ?
               AND sa.seat_id IN (${placeholders})
               AND c.train_id = j.train_id
             FOR UPDATE`,
            [journeyId, ...uniqueSeatIds]
        );

        if (seats.length !== uniqueSeatIds.length) {
            await connection.rollback();

            return res.status(400).json({
                message: "One or more seats are invalid for this journey"
            });
        }

        const unavailable = seats.filter(
            seat =>
                seat.status === "BOOKED" ||
                (seat.status === "HELD" &&
                    Number(seat.held_by) !== Number(req.user.id))
        );

        if (unavailable.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "One or more seats are unavailable"
            });
        }

        await connection.query(
            `UPDATE seat_availability
             SET status = 'HELD',
                 held_by = ?,
                 hold_expires_at =
                    DATE_ADD(NOW(), INTERVAL ${HOLD_MINUTES} MINUTE)
             WHERE journey_id = ?
               AND seat_id IN (${placeholders})`,
            [req.user.id, journeyId, ...uniqueSeatIds]
        );

        await connection.commit();

        res.json({
            message: "Seats held successfully",
            journeyId,
            seatIds: uniqueSeatIds,
            holdMinutes: HOLD_MINUTES
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
        if (connection) connection.release();
    }
};

const createBooking = async (req, res) => {
    let connection;

    try {
        const {
            journeyId,
            source,
            destination,
            classType,
            passengers
        } = req.body;

        if (
            !journeyId ||
            !source ||
            !destination ||
            !classType ||
            !Array.isArray(passengers) ||
            passengers.length === 0
        ) {
            return res.status(400).json({
                message: "Missing booking details"
            });
        }

        for (const passenger of passengers) {
            if (
                !passenger.name ||
                !passenger.age ||
                !passenger.gender ||
                !passenger.seatId
            ) {
                return res.status(400).json({
                    message: "Invalid passenger details"
                });
            }

            if (
                !["MALE", "FEMALE", "OTHER"].includes(
                    passenger.gender.toUpperCase()
                )
            ) {
                return res.status(400).json({
                    message: "Invalid passenger gender"
                });
            }
        }

        const seatIds = passengers.map(p => Number(p.seatId));

        if (new Set(seatIds).size !== seatIds.length) {
            return res.status(400).json({
                message: "Duplicate seats are not allowed"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        await releaseExpiredHolds(connection, journeyId);

        const [journeys] = await connection.query(
            `SELECT j.id, j.train_id, j.status
             FROM journeys j
             WHERE j.id = ?
             FOR UPDATE`,
            [journeyId]
        );

        if (
            journeys.length === 0 ||
            journeys[0].status !== "SCHEDULED"
        ) {
            await connection.rollback();

            return res.status(400).json({
                message: "Journey is not available"
            });
        }

        const trainId = journeys[0].train_id;

        const [route] = await connection.query(
            `SELECT
                src.id AS source_id,
                dst.id AS destination_id,
                sr.stop_number AS source_stop,
                dr.stop_number AS destination_stop

             FROM trains t

             JOIN train_routes sr
                ON sr.train_id = t.id

             JOIN stations src
                ON src.id = sr.station_id

             JOIN train_routes dr
                ON dr.train_id = t.id

             JOIN stations dst
                ON dst.id = dr.station_id

             WHERE t.id = ?
               AND src.station_code = ?
               AND dst.station_code = ?`,
            [
                trainId,
                source.toUpperCase(),
                destination.toUpperCase()
            ]
        );

        if (
            route.length === 0 ||
            route[0].source_stop >= route[0].destination_stop
        ) {
            await connection.rollback();

            return res.status(400).json({
                message: "Invalid source or destination"
            });
        }

        const [fares] = await connection.query(
            `SELECT amount
             FROM fares
             WHERE train_id = ?
               AND source_station_id = ?
               AND destination_station_id = ?
               AND class_type = ?`,
            [
                trainId,
                route[0].source_id,
                route[0].destination_id,
                classType.toUpperCase()
            ]
        );

        if (fares.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Fare not configured"
            });
        }

        const placeholders = seatIds.map(() => "?").join(",");

        const [heldSeats] = await connection.query(
            `SELECT
                sa.seat_id,
                sa.status,
                sa.held_by,
                sa.hold_expires_at,
                c.class_type

             FROM seat_availability sa

             JOIN seats s
                ON s.id = sa.seat_id

             JOIN coaches c
                ON c.id = s.coach_id

             WHERE sa.journey_id = ?
               AND sa.seat_id IN (${placeholders})

             FOR UPDATE`,
            [journeyId, ...seatIds]
        );

        if (heldSeats.length !== seatIds.length) {
            await connection.rollback();

            return res.status(400).json({
                message: "Invalid seat selection"
            });
        }

        const invalidSeat = heldSeats.some(
            seat =>
                seat.status !== "HELD" ||
                Number(seat.held_by) !== Number(req.user.id) ||
                seat.class_type !== classType.toUpperCase()
        );

        if (invalidSeat) {
            await connection.rollback();

            return res.status(409).json({
                message: "Seat hold expired or seat is unavailable"
            });
        }

        const farePerPassenger = Number(fares[0].amount);
        const totalFare = farePerPassenger * passengers.length;

        let pnr;
        let bookingResult;

        for (let attempt = 0; attempt < 5; attempt++) {
            pnr = generatePNR();

            try {
                [bookingResult] = await connection.query(
                    `INSERT INTO bookings
                        (
                            pnr,
                            user_id,
                            journey_id,
                            total_fare,
                            status,
                            source_station_id,
                            destination_station_id
                        )
                     VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`,
                    [
                        pnr,
                        req.user.id,
                        journeyId,
                        totalFare,
                        route[0].source_id,
                        route[0].destination_id
                    ]
                );

                break;
            } catch (error) {
                if (error.code !== "ER_DUP_ENTRY" || attempt === 4) {
                    throw error;
                }
            }
        }

        const bookingId = bookingResult.insertId;

        for (const passenger of passengers) {
            const [passengerResult] = await connection.query(
                `INSERT INTO passengers
                    (booking_id, name, age, gender)
                 VALUES (?, ?, ?, ?)`,
                [
                    bookingId,
                    passenger.name.trim(),
                    passenger.age,
                    passenger.gender.toUpperCase()
                ]
            );

            await connection.query(
                `INSERT INTO booking_seats
                    (
                        booking_id,
                        passenger_id,
                        journey_id,
                        seat_id
                    )
                 VALUES (?, ?, ?, ?)`,
                [
                    bookingId,
                    passengerResult.insertId,
                    journeyId,
                    passenger.seatId
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: "Booking created",
            bookingId,
            pnr,
            totalFare,
            status: "PENDING"
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
        if (connection) connection.release();
    }
};

const getMyBookings = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                b.id AS booking_id,
                b.pnr,
                b.total_fare,
                b.status,
                b.booked_at,

                j.journey_date,

                t.train_number,
                t.train_name,

                src.station_code AS source_code,
                src.station_name AS source_name,

                dst.station_code AS destination_code,
                dst.station_name AS destination_name,

                COUNT(DISTINCT p.id) AS passenger_count

             FROM bookings b

             JOIN journeys j
                ON j.id = b.journey_id

             JOIN trains t
                ON t.id = j.train_id

             JOIN stations src
                ON src.id = b.source_station_id

             JOIN stations dst
                ON dst.id = b.destination_station_id

             LEFT JOIN passengers p
                ON p.booking_id = b.id

             WHERE b.user_id = ?

             GROUP BY
                b.id,
                b.pnr,
                b.total_fare,
                b.status,
                b.booked_at,
                j.journey_date,
                t.train_number,
                t.train_name,
                src.station_code,
                src.station_name,
                dst.station_code,
                dst.station_name

             ORDER BY b.booked_at DESC`,
            [req.user.id]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getBookingByPNR = async (req, res) => {
    try {
        const { pnr } = req.params;

        const [bookings] = await db.query(
            `SELECT
                b.id AS booking_id,
                b.pnr,
                b.total_fare,
                b.status,
                b.booked_at,

                j.id AS journey_id,
                j.journey_date,

                t.train_number,
                t.train_name,

                src.station_code AS source_code,
                src.station_name AS source_name,

                dst.station_code AS destination_code,
                dst.station_name AS destination_name

             FROM bookings b

             JOIN journeys j
                ON j.id = b.journey_id

             JOIN trains t
                ON t.id = j.train_id

             JOIN stations src
                ON src.id = b.source_station_id

             JOIN stations dst
                ON dst.id = b.destination_station_id

             WHERE b.pnr = ?
               AND b.user_id = ?`,
            [
                pnr,
                req.user.id
            ]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const booking = bookings[0];

        const [passengers] = await db.query(
            `SELECT
                p.id,
                p.name,
                p.age,
                p.gender,

                c.coach_number,
                c.class_type,

                s.seat_number,
                s.berth_type

             FROM passengers p

             LEFT JOIN booking_seats bs
                ON bs.passenger_id = p.id

             LEFT JOIN seats s
                ON s.id = bs.seat_id

             LEFT JOIN coaches c
                ON c.id = s.coach_id

             WHERE p.booking_id = ?

             ORDER BY p.id`,
            [booking.booking_id]
        );

        const [payments] = await db.query(
            `SELECT
                id,
                provider,
                provider_order_id,
                provider_payment_id,
                amount,
                currency,
                status,
                created_at,
                paid_at

             FROM payments

             WHERE booking_id = ?

             ORDER BY id DESC`,
            [booking.booking_id]
        );

        res.json({
            ...booking,
            passengers,
            payments
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const cancelBooking = async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [bookings] = await connection.query(
            `SELECT
                b.id,
                b.user_id,
                b.status,
                b.journey_id,
                j.journey_date

             FROM bookings b

             JOIN journeys j
                ON j.id = b.journey_id

             WHERE b.id = ?

             FOR UPDATE`,
            [id]
        );

        if (bookings.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const booking = bookings[0];

        if (Number(booking.user_id) !== Number(req.user.id)) {
            await connection.rollback();

            return res.status(403).json({
                message: "Access denied"
            });
        }

        if (booking.status === "CANCELLED") {
            await connection.rollback();

            return res.status(400).json({
                message: "Booking already cancelled"
            });
        }

        if (
            !["CONFIRMED", "PENDING", "PAYMENT_FAILED"].includes(
                booking.status
            )
        ) {
            await connection.rollback();

            return res.status(400).json({
                message: `Cannot cancel ${booking.status} booking`
            });
        }

        await connection.query(
            `UPDATE bookings
             SET status = 'CANCELLED'
             WHERE id = ?`,
            [id]
        );

        await connection.query(
            `UPDATE seat_availability sa

             JOIN booking_seats bs
                ON bs.journey_id = sa.journey_id
               AND bs.seat_id = sa.seat_id

             SET sa.status = 'AVAILABLE',
                 sa.held_by = NULL,
                 sa.hold_expires_at = NULL

             WHERE bs.booking_id = ?`,
            [id]
        );

        const [payments] = await connection.query(
            `SELECT id
             FROM payments
             WHERE booking_id = ?
               AND status = 'SUCCESS'
             FOR UPDATE`,
            [id]
        );

        if (payments.length > 0) {
            await connection.query(
                `UPDATE payments
                 SET status = 'REFUNDED'
                 WHERE booking_id = ?
                   AND status = 'SUCCESS'`,
                [id]
            );
        }

        await connection.commit();

        res.json({
            message: "Booking cancelled successfully",
            bookingId: Number(id),
            bookingStatus: "CANCELLED",
            refund:
                payments.length > 0
                    ? "REFUNDED"
                    : "NOT_REQUIRED"
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
        if (connection) connection.release();
    }
};
module.exports = {
    holdSeats,
    createBooking,
    getMyBookings,
    getBookingByPNR,
    cancelBooking
};