const db = require("../config/db");

const createPayment = async (req, res) => {
    let connection;

    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                message: "bookingId is required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [bookings] = await connection.query(
            `SELECT id, user_id, total_fare, status
             FROM bookings
             WHERE id = ?
             FOR UPDATE`,
            [bookingId]
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

        if (booking.status !== "PENDING") {
            await connection.rollback();

            return res.status(400).json({
                message: `Booking is ${booking.status}`
            });
        }

        const [existing] = await connection.query(
            `SELECT id, status
             FROM payments
             WHERE booking_id = ?
               AND status IN ('CREATED', 'SUCCESS')
             ORDER BY id DESC
             LIMIT 1`,
            [bookingId]
        );

        if (existing.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "Payment already exists",
                paymentId: existing[0].id,
                status: existing[0].status
            });
        }

        const orderId =
            `ORDER_${bookingId}_${Date.now()}`;

        const [result] = await connection.query(
            `INSERT INTO payments
                (
                    booking_id,
                    provider,
                    provider_order_id,
                    amount,
                    currency,
                    status
                )
             VALUES (?, 'SIMULATED', ?, ?, 'INR', 'CREATED')`,
            [
                bookingId,
                orderId,
                booking.total_fare
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Payment created",
            paymentId: result.insertId,
            orderId,
            amount: Number(booking.total_fare),
            currency: "INR",
            status: "CREATED"
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

const completePayment = async (req, res) => {
    let connection;

    try {
        const { paymentId, success } = req.body;

        if (!paymentId || typeof success !== "boolean") {
            return res.status(400).json({
                message: "paymentId and success are required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [payments] = await connection.query(
            `SELECT
                p.id,
                p.booking_id,
                p.amount,
                p.status AS payment_status,
                b.user_id,
                b.journey_id,
                b.status AS booking_status

             FROM payments p

             JOIN bookings b
                ON b.id = p.booking_id

             WHERE p.id = ?

             FOR UPDATE`,
            [paymentId]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        if (Number(payment.user_id) !== Number(req.user.id)) {
            await connection.rollback();

            return res.status(403).json({
                message: "Access denied"
            });
        }

        if (payment.payment_status !== "CREATED") {
            await connection.rollback();

            return res.status(400).json({
                message: `Payment is already ${payment.payment_status}`
            });
        }

        if (payment.booking_status !== "PENDING") {
            await connection.rollback();

            return res.status(400).json({
                message: `Booking is ${payment.booking_status}`
            });
        }

        if (!success) {
            await connection.query(
                `UPDATE payments
                 SET status = 'FAILED'
                 WHERE id = ?`,
                [paymentId]
            );

            await connection.query(
                `UPDATE bookings
                 SET status = 'PAYMENT_FAILED'
                 WHERE id = ?`,
                [payment.booking_id]
            );

            await connection.query(
                `UPDATE seat_availability sa
                 JOIN booking_seats bs
                    ON bs.seat_id = sa.seat_id
                   AND bs.journey_id = sa.journey_id

                 SET sa.status = 'AVAILABLE',
                     sa.held_by = NULL,
                     sa.hold_expires_at = NULL

                 WHERE bs.booking_id = ?
                   AND sa.status = 'HELD'
                   AND sa.held_by = ?`,
                [
                    payment.booking_id,
                    req.user.id
                ]
            );

            await connection.commit();

            return res.json({
                message: "Payment failed",
                bookingId: payment.booking_id,
                paymentId,
                bookingStatus: "PAYMENT_FAILED"
            });
        }

        const [bookingSeats] = await connection.query(
            `SELECT
                sa.id,
                sa.status,
                sa.held_by,
                sa.hold_expires_at

             FROM booking_seats bs

             JOIN seat_availability sa
                ON sa.journey_id = bs.journey_id
               AND sa.seat_id = bs.seat_id

             WHERE bs.booking_id = ?

             FOR UPDATE`,
            [payment.booking_id]
        );

        if (bookingSeats.length === 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "Booking has no assigned seats"
            });
        }

        const invalid = bookingSeats.some(
            seat =>
                seat.status !== "HELD" ||
                Number(seat.held_by) !== Number(req.user.id) ||
                !seat.hold_expires_at ||
                new Date(seat.hold_expires_at) < new Date()
        );

        if (invalid) {
            await connection.query(
                `UPDATE payments
                 SET status = 'FAILED'
                 WHERE id = ?`,
                [paymentId]
            );

            await connection.query(
                `UPDATE bookings
                 SET status = 'PAYMENT_FAILED'
                 WHERE id = ?`,
                [payment.booking_id]
            );

            await connection.commit();

            return res.status(409).json({
                message: "Seat hold expired",
                bookingStatus: "PAYMENT_FAILED"
            });
        }

        const providerPaymentId =
            `PAY_${paymentId}_${Date.now()}`;

        await connection.query(
            `UPDATE payments
             SET status = 'SUCCESS',
                 provider_payment_id = ?,
                 paid_at = NOW()
             WHERE id = ?`,
            [
                providerPaymentId,
                paymentId
            ]
        );

        await connection.query(
            `UPDATE bookings
             SET status = 'CONFIRMED'
             WHERE id = ?`,
            [payment.booking_id]
        );

        await connection.query(
            `UPDATE seat_availability sa

             JOIN booking_seats bs
                ON bs.seat_id = sa.seat_id
               AND bs.journey_id = sa.journey_id

             SET sa.status = 'BOOKED',
                 sa.held_by = NULL,
                 sa.hold_expires_at = NULL

             WHERE bs.booking_id = ?`,
            [payment.booking_id]
        );

        await connection.commit();

        res.json({
            message: "Payment successful",
            paymentId,
            providerPaymentId,
            bookingId: payment.booking_id,
            bookingStatus: "CONFIRMED"
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
    createPayment,
    completePayment
};