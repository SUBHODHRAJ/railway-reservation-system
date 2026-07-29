const db = require("../../config/db");

const releaseExpiredHolds = async (connection, journeyId = null) => {
    const params = [];
    let journeyFilter = "";

    if (journeyId !== null && journeyId !== undefined) {
        journeyFilter = "AND sa.journey_id = ?";
        params.push(journeyId);
    }

    const [expiredHolds] = await connection.query(
        `SELECT
            sa.id,
            sa.journey_id,
            sa.seat_id,
            b.id AS booking_id
         FROM seat_availability sa
         LEFT JOIN booking_seats bs
            ON bs.journey_id = sa.journey_id
           AND bs.seat_id = sa.seat_id
         LEFT JOIN bookings b
            ON b.id = bs.booking_id
           AND b.status = 'PENDING'
         WHERE sa.status = 'HELD'
           AND sa.hold_expires_at IS NOT NULL
           AND sa.hold_expires_at < NOW()
           ${journeyFilter}
         FOR UPDATE`,
        params
    );

    const bookingIds = [
        ...new Set(
            expiredHolds
                .filter(row => row.booking_id !== null)
                .map(row => Number(row.booking_id))
        )
    ];

    if (bookingIds.length > 0) {
        const placeholders = bookingIds.map(() => "?").join(",");

        await connection.query(
            `UPDATE payments
             SET status = 'FAILED'
             WHERE booking_id IN (${placeholders})
               AND status = 'CREATED'`,
            bookingIds
        );

        await connection.query(
            `UPDATE bookings
             SET status = 'EXPIRED'
             WHERE id IN (${placeholders})
               AND status = 'PENDING'`,
            bookingIds
        );
    }

    if (expiredHolds.length > 0) {
        const holdIds = expiredHolds.map(row => row.id);
        const placeholders = holdIds.map(() => "?").join(",");

        await connection.query(
            `UPDATE seat_availability
             SET status = 'AVAILABLE',
                 held_by = NULL,
                 hold_expires_at = NULL
             WHERE id IN (${placeholders})
               AND status = 'HELD'
               AND hold_expires_at < NOW()`,
            holdIds
        );
    }

    return {
        releasedSeats: expiredHolds.length,
        expiredBookings: bookingIds.length
    };
};

const cleanupExpiredReservations = async (journeyId = null) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const result = await releaseExpiredHolds(
            connection,
            journeyId
        );

        await connection.commit();

        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    releaseExpiredHolds,
    cleanupExpiredReservations
};
