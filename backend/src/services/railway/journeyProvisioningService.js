const db = require("../../config/db");
const {
    getOperatingDate,
    checkOperatingDate
} = require("./trainOperatingDateService");
const {
    syncTrain
} = require("./trainSyncService");
const {
    generateFares
} = require("./fareGenerationService");
const {
    createInventory
} = require("./reservationInventoryService");

const provisionJourney = async (
    trainNumber,
    journeyDate,
    trainData = null
) => {
    const operating = trainData
        ? checkOperatingDate(
            trainData,
            journeyDate
        )
        : await getOperatingDate(
            trainNumber,
            journeyDate
        );
    if (!operating.runsOnDate) {
        return {
            provisioned: false,
            reason: "TRAIN_NOT_RUNNING",
            trainNumber: String(trainNumber),
            journeyDate
        };
    }

const synced = await syncTrain(
    trainNumber,
    operating.train
);
    const [existing] = await db.query(
        `SELECT id, status
         FROM journeys
         WHERE train_id = ?
           AND journey_date = ?
         LIMIT 1`,
        [
            synced.trainId,
            journeyDate
        ]
    );

    if (existing.length > 0) {
        return {
            provisioned: false,
            reason: "JOURNEY_ALREADY_EXISTS",
            trainId: synced.trainId,
            journeyId: existing[0].id,
            journeyStatus: existing[0].status,
            journeyDate
        };
    }

const inventoryResult = await createInventory(
    trainNumber,
    journeyDate,
    operating.train
);

    const fareResult = await generateFares(
        trainNumber
    );

    return {
        provisioned: inventoryResult.created,
        trainId: synced.trainId,
        trainNumber: String(trainNumber),
        journeyId: inventoryResult.journeyId,
        journeyDate,
        routeStops: synced.routeStops,
        inventory: inventoryResult,
        fares: fareResult
    };
};

module.exports = {
    provisionJourney
};