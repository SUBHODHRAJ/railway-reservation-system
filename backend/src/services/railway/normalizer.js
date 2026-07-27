const normalizeTrain = (response) => {
    const payload = response?.data;
    const train = payload?.train;
    const route = payload?.route;

    if (!train || !Array.isArray(route)) {
        throw new Error("Invalid railway provider response");
    }

    return {
        trainNumber: train.number,
        trainName: train.name,
        type: train.type,
        category: train.category,

        source: {
            code: train.source?.code,
            name: train.source?.name
        },

        destination: {
            code: train.destination?.code,
            name: train.destination?.name
        },

        runDays: train.runDays || [],

        distanceKm: train.distance ?? null,
        durationMinutes: train.duration ?? null,

        returnTrain: train.returnTrain ?? null,

        coachPosition: train.coachPosition ?? null,

        route: route
            .filter((stop) => stop.isHalt)
            .map((stop) => ({
                sequence: stop.sequence,

                stationCode: stop.station?.code,
                stationName: stop.station?.name,

                arrival: stop.arrival ?? null,
                arrivalDay: stop.arrivalDay ?? null,

                departure: stop.departure ?? null,
                departureDay: stop.departureDay ?? null,

                platform: stop.platform ?? null,
                distanceKm: stop.distance ?? null
            }))
    };
};

module.exports = {
    normalizeTrain
};

