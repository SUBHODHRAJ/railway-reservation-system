const railwayService = require("../services/railway/railwayService");
const localTrainService = require("../services/railway/localTrainService");

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

module.exports = {
    getExternalTrain
};
