const db = require("../../config/db");
const railwayService = require("./railwayService");
const {
    parseCoachComposition
} = require("./coachCompositionService");

const berthPatterns = {
    SL: ["LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU"],
    "3A": ["LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU"],
    "2A": ["LB", "UB", "LB", "UB", "SL", "SU"],
    "1A": ["LB", "UB"]
};

const createInventory = async (trainNumber, journeyDate) => {
    let connection;

    try {
        const externalTrain = await railwayService.getTrain(trainNumber);

        const composition = parseCoachComposition(
            externalTrain.coachPosition
        );

        if (composition.length === 0) {
            throw new Error(
                "No supported reservable coach composition available"
            );
        }

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

        let [coaches] = await connection.query(
            `SELECT id, coach_number, class_type
             FROM coaches
             WHERE train_id = ?`,
            [trainId]
        );

        if (coaches.length === 0) {
            for (const coach of composition) {
                const [coachResult] = await connection.query(
                    `INSERT INTO coaches
                        (train_id, coach_number, class_type)
                     VALUES (?, ?, ?)`,
                    [
                        trainId,
                        coach.coachNumber,
                        coach.classType
                    ]
                );

                const coachId = coachResult.insertId;
                const pattern = berthPatterns[coach.classType];

                for (
                    let seatNumber = 1;
                    seatNumber <= coach.seatCount;
                    seatNumber++
                ) {
                    const berthType =
                        pattern[(seatNumber - 1) % pattern.length];

                    await connection.query(
                        `INSERT INTO seats
                            (coach_id, seat_number, berth_type)
                         VALUES (?, ?, ?)`,
                        [
                            coachId,
                            seatNumber,
                            berthType
                        ]
                    );
                }
            }

            [coaches] = await connection.query(
                `SELECT id, coach_number, class_type
                 FROM coaches
                 WHERE train_id = ?`,
                [trainId]
            );
        }

        const [journeyResult] = await connection.query(
            `INSERT INTO journeys
                (train_id, journey_date)
             VALUES (?, ?)`,
            [trainId, journeyDate]
        );

        const journeyId = journeyResult.insertId;

        const [seats] = await connection.query(
            `SELECT s.id
             FROM seats s
             JOIN coaches c
               ON c.id = s.coach_id
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
