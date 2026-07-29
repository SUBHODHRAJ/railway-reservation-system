const railwayService = require("./railwayService");
const {
    provisionJourney
} = require("./journeyProvisioningService");
const formatDate = date => {
    const year = date.getUTCFullYear();
    const month = String(
        date.getUTCMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getUTCDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const syncJourneyWindow = async (
    trainNumber,
    {
        startDate = null,
        days = 7
    } = {}
) => {
    const totalDays = Number(days);

    if (
        !Number.isInteger(totalDays) ||
        totalDays < 1 ||
        totalDays > 120
    ) {
        throw new Error(
            "Journey sync window must be between 1 and 120 days"
        );
    }

    const start = startDate
        ? new Date(`${startDate}T00:00:00Z`)
        : new Date();

    if (Number.isNaN(start.getTime())) {
        throw new Error("Invalid start date");
    }

    const train = await railwayService.getTrain(
    trainNumber
);

const results = [];

for (let offset = 0; offset < totalDays; offset++) {
        const date = new Date(start);

        date.setUTCDate(
            start.getUTCDate() + offset
        );

        const journeyDate = formatDate(date);

        const result = await provisionJourney(
            trainNumber,
            journeyDate,
	    train
        );

        results.push(result);
    }

    return {
        trainNumber: String(trainNumber),
        startDate: formatDate(start),
        days: totalDays,

        created: results.filter(
            result => result.provisioned
        ).length,

        existing: results.filter(
            result =>
                result.reason ===
                "JOURNEY_ALREADY_EXISTS"
        ).length,

        notRunning: results.filter(
            result =>
                result.reason ===
                "TRAIN_NOT_RUNNING"
        ).length,

        results
    };
};

module.exports = {
    syncJourneyWindow
};