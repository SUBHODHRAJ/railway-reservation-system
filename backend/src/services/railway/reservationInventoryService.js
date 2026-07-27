const db = require("../../config/db");

const berthPattern = ["LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU"];

const createInventory = async (trainNumber, journeyDate) => {
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [trains] = await connection.query(
            `SELECT id
             FROM trains
             WHERE train_number = ?
             LIMIT 1`,
            [String(trainNumber)]
        );

        if (trains.length === 0) {
            throw new Error("Train not found locally");
        }

        const trainId = trains[0].id;

        const [existingJourney] = await connection.query(
            `SELECT id
             FROM journeys
             WHERE train_id = ?
               AND journey_date = ?
             LIMIT 1`,
            [trainId, journeyDate]
        );

        if (existingJourney.length > 0) {
            await connection.rollback();

            return {
                created: false,
                reason: "JOURNEY_ALREADY_EXISTS",
                journeyId: existingJourney[0].id
            };
        }

        const [journeyResult] = await connection.query(
            `INSERT INTO journeys (train_id, journey_date)
             VALUES (?, ?)`,
            [trainId, journeyDate]
        );

        const journeyId = journeyResult.insertId;

        let [coaches] = await connection.query(
            `SELECT id, coach_number
             FROM coaches
             WHERE train_id = ?
             ORDER BY coach_number`,
            [trainId]
        );

        if (coaches.length === 0) {
            for (const coachNumber of ["S1", "S2", "S3"]) {
                const [coachResult] = await connection.query(
                    `INSERT INTO coaches
                        (train_id, coach_number, class_type)
                     VALUES (?, ?, 'SL')`,
                    [trainId, coachNumber]
                );

                const coachId = coachResult.insertId;

                for (let seatNumber = 1; seatNumber <= 72; seatNumber++) {
                    const berthType =
                        berthPattern[(seatNumber - 1) % berthPattern.length];

                    await connection.query(
                        `INSERT INTO seats
                            (coach_id, seat_number, berth_type)
                         VALUES (?, ?, ?)`,
                        [coachId, seatNumber, berthType]
                    );
                }
            }

            [coaches] = await connection.query(
                `SELECT id, coach_number
                 FROM coaches
                 WHERE train_id = ?
                 ORDER BY coach_number`,
                [trainId]
            );
        }

        const [seats] = await connection.query(
            `SELECT s.id
             FROM seats s
             JOIN coaches c ON c.id = s.coach_id
             WHERE c.train_id = ?`,
            [trainId]
        );

        for (const seat of seats) {
            await connection.query(
                `INSERT INTO seat_availability
                    (journey_id, seat_id, status)
                 VALUES (?, ?, 'AVAILABLE')`,
                [journeyId, seat.id]
            );
        }

        await connection.commit();

        return {
            created: true,
            trainId,
            journeyId,
            journeyDate,
            coaches: coaches.length,
            seats: seats.length
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
    createInventory
};
