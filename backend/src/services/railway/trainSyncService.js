const db = require("../../config/db");
const railwayService = require("./railwayService");

const syncTrain = async (
    trainNumber,
    trainData = null
) => {
    const externalTrain =
        trainData ||
        await railwayService.getTrain(trainNumber);
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `INSERT INTO trains
                (train_number, train_name)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
                train_name = VALUES(train_name)`,
            [
                String(externalTrain.trainNumber),
                externalTrain.trainName
            ]
        );

        const [trains] = await connection.query(
            `SELECT id
             FROM trains
             WHERE train_number = ?
             LIMIT 1`,
            [String(externalTrain.trainNumber)]
        );

        const trainId = trains[0].id;

        for (let i = 0; i < externalTrain.route.length; i++) {
            const stop = externalTrain.route[i];

            await connection.query(
                `INSERT INTO stations
                    (station_code, station_name, city)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    station_name = VALUES(station_name)`,
                [
                    stop.stationCode,
                    stop.stationName || stop.stationCode,
                    stop.stationName || stop.stationCode
                ]
            );

            const [stations] = await connection.query(
                `SELECT id
                 FROM stations
                 WHERE station_code = ?
                 LIMIT 1`,
                [stop.stationCode]
            );

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
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    station_id = VALUES(station_id),
                    distance_km = VALUES(distance_km),
                    arrival_time = VALUES(arrival_time),
                    departure_time = VALUES(departure_time)`,
                [
                    trainId,
                    stations[0].id,
                    i + 1,
                    stop.distanceKm ?? null,
                    stop.arrival,
                    stop.departure
                ]
            );
        }

        await connection.commit();

        return {
            synced: true,
            trainId,
            trainNumber: String(externalTrain.trainNumber),
            trainName: externalTrain.trainName,
            routeStops: externalTrain.route.length
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    syncTrain
};