const railwayService = require("../services/railway/railwayService");
const localTrainService = require("../services/railway/localTrainService");
const {
    syncTrainRouteMetadata
} = require("../services/railway/trainRouteSyncService");

const {
    generateFares
} = require("../services/railway/fareGenerationService");

const {
    importTrainMetadata
} = require("../services/railway/trainMetadataImportService");

const {
    createInventory
} = require("../services/railway/reservationInventoryService");

const getExternalTrain = async (req, res, next) => {
    try {
        const { trainNumber } = req.params;

        const train = await railwayService.getTrain(trainNumber);

        const localTrain = await localTrainService.findByTrainNumber(
            train.trainNumber
        );

        res.json({
            source: "external",
            provider: "railradar",
            reservationInventory: localTrain ? "LOCAL" : "NOT_CONFIGURED",
            localTrain,
            train
        });
    } catch (error) {
        next(error);
    }
};

const importExternalTrain = async (req, res, next) => {
    try {
        const { trainNumber } = req.params;

        const train = await railwayService.getTrain(trainNumber);
        const result = await importTrainMetadata(train);

        res.status(result.imported ? 201 : 409).json({
            source: "external",
            provider: "railradar",
            ...result
        });
    } catch (error) {
        next(error);
    }
};

const createTrainInventory = async (req, res, next) => {
    try {
        const { trainNumber } = req.params;
        const { journeyDate } = req.body;

        const result = await createInventory(
            trainNumber,
            journeyDate
        );

        res.status(result.created ? 201 : 409).json(result);
    } catch (error) {
        next(error);
    }
};

const syncExternalTrain = async (req, res, next) => {
    try {
        const { trainNumber } = req.params;

        const result = await syncTrainRouteMetadata(trainNumber);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

const generateTrainFares = async (req, res, next) => {
    try {
        const { trainNumber } = req.params;

        const result = await generateFares(trainNumber);

        res.json(result);
    } catch (error) {
        next(error);
    }
};
const searchExternalTrains = async (req, res, next) => {
    try {
        const {
            source,
            destination,
            date
        } = req.query;

        const result = await railwayService.getTrainsBetween(
            source,
            destination,
            {
                date,
                live: false,
                byCity: false
            }
        );

        res.json({
            source: "external",
            provider: "railradar",
            journeyDate: date,
            ...result
        });
    } catch (error) {
        next(error);
    }
};
const getExternalLiveStatus = async (req, res, next) => {
    try {
        const { trainNumber } = req.params;
        const { date } = req.query;

        const result =
            await railwayService.getLiveTrainStatus(
                trainNumber,
                date || null
            );

        res.json({
            source: "external",
            provider: "railradar",
            ...result
        });
    } catch (error) {
        next(error);
    }
};
module.exports = {
    getExternalTrain,
    searchExternalTrains,
    getExternalLiveStatus,
    importExternalTrain,
    createTrainInventory,
    syncExternalTrain,
    generateTrainFares
};