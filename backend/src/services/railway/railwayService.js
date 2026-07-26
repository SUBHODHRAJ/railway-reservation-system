const railRadarProvider = require("./railRadarProvider");
const { normalizeTrain } = require("./normalizer");

const getTrain = async (trainNumber) => {
    const response = await railRadarProvider.getTrain(trainNumber);

    return normalizeTrain(response);
};

module.exports = {
    getTrain
};