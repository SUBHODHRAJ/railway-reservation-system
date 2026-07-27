const db = require("../../config/db");

const CLASS_RATES = {
    SL: 0.50,
    "3A": 1.35,
    "2A": 1.90,
    "1A": 3.20
};

const MIN_FARES = {
    SL: 50,
    "3A": 150,
    "2A": 250,
    "1A": 400
};

const roundFare = amount => Math.ceil(amount / 5) * 5;

const generateFares = async trainNumber => {
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

        const [routes] = await connection.query(
            `SELECT
                tr.station_id,
                tr.stop_number,
                tr.distance_km
             FROM train_routes tr
             WHERE tr.train_id = ?
             ORDER BY tr.stop_number`,
            [trainId]
        );

        if (routes.length < 2) {
            throw new Error("Train route is incomplete");
        }

        if (routes.some(route => route.distance_km === null)) {
            throw new Error("Route distance metadata is incomplete");
        }

        const [classes] = await connection.query(
            `SELECT DISTINCT class_type
             FROM coaches
             WHERE train_id = ?`,
            [trainId]
        );

        if (classes.length === 0) {
            throw new Error("No reservable classes configured");
        }

        let generated = 0;

        for (let i = 0; i < routes.length - 1; i++) {
            for (let j = i + 1; j < routes.length; j++) {
                const distance =
                    Number(routes[j].distance_km) -
                    Number(routes[i].distance_km);

                if (distance <= 0) {
                    continue;
                }

                for (const row of classes) {
                    const classType = row.class_type;
                    const rate = CLASS_RATES[classType];

                    if (!rate) {
                        continue;
                    }

                    const fare = Math.max(
                        MIN_FARES[classType],
                        roundFare(distance * rate)
                    );

                    const [result] = await connection.query(
                        `INSERT INTO fares
                            (
                                train_id,
                                source_station_id,
                                destination_station_id,
                                class_type,
                                amount
                            )
                         VALUES (?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                            amount = VALUES(amount)`,
                        [
                            trainId,
                            routes[i].station_id,
                            routes[j].station_id,
                            classType,
                            fare
                        ]
                    );

                    if (result.affectedRows > 0) {
                        generated++;
                    }
                }
            }
        }

        await connection.commit();

        return {
            generated: true,
            trainId,
            trainNumber: String(trainNumber),
            routeStops: routes.length,
            classes: classes.map(row => row.class_type),
            fareRecords: generated
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
    generateFares
};
