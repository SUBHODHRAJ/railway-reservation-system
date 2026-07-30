const db = require("../../config/db");

const cancelBookingById = async bookingId => {
    let connection;

    try {
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
            [bookingId]
        );

        if (bookings.length === 0) {
            const error =
                new Error("Booking not found");

            error.status = 404;
            throw error;
        }

        const booking = bookings[0];

        if (booking.status === "CANCELLED") {
            const error =
                new Error(
                    "Booking already cancelled"
                );

            error.status = 400;
            throw error;
        }

        if (
            ![
                "CONFIRMED",
                "PENDING",
                "PAYMENT_FAILED"
            ].includes(booking.status)
        ) {
            const error =
                new Error(
                    `Cannot cancel ${booking.status} booking`
                );

            error.status = 400;
            throw error;
        }

        await connection.query(
            `UPDATE bookings
             SET status = 'CANCELLED'
             WHERE id = ?`,
            [bookingId]
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
            [bookingId]
        );

        const [payments] =
            await connection.query(
                `SELECT id
                 FROM payments
                 WHERE booking_id = ?
                   AND status = 'SUCCESS'
                 FOR UPDATE`,
                [bookingId]
            );

        if (payments.length > 0) {
            await connection.query(
                `UPDATE payments
                 SET status = 'REFUNDED'
                 WHERE booking_id = ?
                   AND status = 'SUCCESS'`,
                [bookingId]
            );
        }

        await connection.commit();

        return {
            bookingId: Number(bookingId),
            bookingStatus: "CANCELLED",
            refund:
                payments.length > 0
                    ? "REFUNDED"
                    : "NOT_REQUIRED",
            userId: booking.user_id
        };
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }

        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    cancelBookingById
};