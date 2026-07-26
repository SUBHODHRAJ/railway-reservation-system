const railwayService = require("../services/railway/railwayService");

const getExternalTrain = async (req, res, next) => {
    try {
        const { trainNumber } = req.params;

        const train = await railwayService.getTrain(trainNumber);

        res.json({
            source: "external",
            provider: "railradar",
            reservationInventory: "TRAIN_SIMULATED",
            train
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getExternalTrain
};