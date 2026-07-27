const db = require("../../config/db");

const importTrainMetadata = async (train) => {
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.query(
            `SELECT id, train_number, train_name
             FROM trains
             WHERE train_number = ?
             LIMIT 1`,
            [String(train.trainNumber)]
        );

        if (existing.length > 0) {
            await connection.rollback();

            return {
                imported: false,
                reason: "TRAIN_ALREADY_EXISTS",
                train: existing[0]
            };
        }

        const [trainResult] = await connection.query(
            `INSERT INTO trains (train_number, train_name)
             VALUES (?, ?)`,
            [String(train.trainNumber), train.trainName]
        );

        const trainId = trainResult.insertId;

        for (let i = 0; i < train.route.length; i++) {
            const stop = train.route[i];

            const [stations] = await connection.query(
                `SELECT id
                 FROM stations
                 WHERE station_code = ?
                 LIMIT 1`,
                [stop.stationCode]
            );

            let stationId;

            if (stations.length > 0) {
                stationId = stations[0].id;
            } else {
                const [stationResult] = await connection.query(
                    `INSERT INTO stations
                        (station_code, station_name, city)
                     VALUES (?, ?, ?)`,
                    [
                        stop.stationCode,
                        stop.stationName || stop.stationCode,
                        stop.stationName || stop.stationCode
                    ]
                );

                stationId = stationResult.insertId;
            }

            await connection.query(
                `INSERT INTO train_routes
                    (
                        train_id,
                        station_id,
                        stop_number,
                        distance_km,
                        arrival_time,
                        departure_time
                    )
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    trainId,
                    stationId,
                    i + 1,
                    stop.distanceKm ?? null,
                    stop.arrival,
                    stop.departure
                ]
            );
        }

        await connection.commit();

        return {
            imported: true,
            trainId,
            trainNumber: String(train.trainNumber),
            routeStops: train.route.length
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
    importTrainMetadata
};