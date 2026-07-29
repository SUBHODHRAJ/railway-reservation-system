const railRadarProvider = require("./railRadarProvider");
const {
    normalizeTrain,
    normalizeTrainsBetween,
    normalizeLiveTrainStatus
} = require("./normalizer");

const getTrain = async trainNumber => {
    const response = await railRadarProvider.getTrain(trainNumber);

    return normalizeTrain(response);
};

const getTrainsBetween = async (
    source,
    destination,
    options = {}
) => {
    const response = await railRadarProvider.getTrainsBetween(
        source,
        destination,
        options
    );

    return normalizeTrainsBetween(response);
};

const getLiveTrainStatus = async (
    trainNumber,
    date = null
) => {
    const response =
        await railRadarProvider.getLiveTrainStatus(
            trainNumber,
            date
        );

    return normalizeLiveTrainStatus(response);
};

module.exports = {
    getTrain,
    getTrainsBetween,
    getLiveTrainStatus
};