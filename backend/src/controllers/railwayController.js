const railwayService = require("../services/railway/railwayService");
const localTrainService = require("../services/railway/localTrainService");
const {
    importTrainMetadata
} = require("../services/railway/trainMetadataImportService");

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

module.exports = {
    getExternalTrain,
    importExternalTrain
};
