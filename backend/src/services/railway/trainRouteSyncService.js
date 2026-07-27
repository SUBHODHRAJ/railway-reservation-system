const db = require("../../config/db");
const railwayService = require("./railwayService");

const syncTrainRouteMetadata = async (trainNumber) => {
    const train = await railwayService.getTrain(trainNumber);
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [trains] = await connection.query(
            `SELECT id FROM trains
             WHERE train_number = ?
             LIMIT 1`,
            [String(trainNumber)]
        );

        if (trains.length === 0) {
            throw new Error("Train not found locally");
        }

        const trainId = trains[0].id;
        let updatedStops = 0;

        for (const stop of train.route) {
            const [result] = await connection.query(
                `UPDATE train_routes tr
                 JOIN stations s ON s.id = tr.station_id
                 SET tr.distance_km = ?,
                     tr.arrival_time = ?,
                     tr.departure_time = ?
                 WHERE tr.train_id = ?
                   AND s.station_code = ?`,
                [
                    stop.distanceKm ?? null,
                    stop.arrival,
                    stop.departure,
                    trainId,
                    stop.stationCode
                ]
            );

            updatedStops += result.affectedRows;
        }

        await connection.commit();

        return {
            synced: true,
            trainId,
            trainNumber: String(trainNumber),
            updatedStops
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
    syncTrainRouteMetadata
};
